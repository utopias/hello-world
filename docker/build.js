var fs = require('fs');
var os = require('os');
var path = require('path');
var url = require('url'); // Used to parse out the pathname of the repo to determine the proper image name

var moment = require('moment'); // Used to timestamp the docker image within the metadata (LABELs)
var request = require('request'); // Used to make an http request to get the all of stable node versions
var semver = require('semver'); // Used to parse the max semversion based upon the range defined in the package.json
var yaml = require('json2yaml'); // Used to write docker-compose.yml

var config = require(path.join(__dirname, '../app/server/helpers/config'));
var dockerComposeFileDest = path.join(__dirname, '../docker-compose.yml');
var dockerFileDest = path.join(__dirname, '../Dockerfile');
var dockerIgnoreSrc = path.join(__dirname, './app/{{dockerBuildType}}/.dockerignore');
var dockerIgnoreDest = path.join(__dirname, '../.dockerignore');
var gitInfo = require('../.git.json');
var packageJsonFileDest = path.join(__dirname, '../package.json');

var packageJson = require(packageJsonFileDest);
var numberOfInstances = parseInt(config.get('DOCKER_APP_INSTANCES'), 0) || 1; // Used to scale the docker containers properly with haproxy
var dockerImageTag = getDockerImageTag(packageJson);
var validDockerBuildTypes = {
  local: 'local',
  release: 'release'
};
var dockerBuildType = validDockerBuildTypes[(process.env.DOCKER_BUILD_TYPE || '').toLowerCase()] || validDockerBuildTypes.local;
var serviceName = 'service';

var dfBuilder = require('node-dockerfile');
var dockerFile = new dfBuilder();

var reqOpts = {
  uri: 'https://semver.io/node.json',
  json: true
};

request.get(reqOpts, function(err, res) {
  var semversions = res.body;
  var version = config.get('DOCKER_FORCE_NODE_VERSION') || semver.maxSatisfying(semversions.stableVersions, packageJson.engines.node);

  writeDockerFile(version, dockerBuildType, validDockerBuildTypes, dockerFileDest);
  writeDockerComposeFile(version, dockerBuildType, dockerComposeFileDest);
  writePackageJsonDockerScripts(packageJson, packageJsonFileDest);
});

function getDockerImageTag(packageJson) {
  var urlObj = url.parse(packageJson.repository.url);
  var imageName = urlObj.pathname.replace('/', '');

  return imageName + ':' + packageJson.version;
}

function writeDockerFile(version, dockerBuildType, validDockerBuildTypes, destPath) {
  var now = moment();

  dockerFile
    .comment('Automatically determined based upon package.json')
    .from('node:' + version)
    .newLine()
    .comment('Create a directory to hold your application')
    .run('mkdir -p /src')
    .newLine()
    .comment('Set $cwd')
    .workDir('/src')
    .newLine()
    .comment('Copy the package.json so we don\'t retrigger unecessary npm installs')
    .add('package.json', 'package.json')
    ;

  dockerFile
    .newLine()
    .comment('Run npm install')
    .run('npm install -q --production')
    ;

  dockerFile
    .newLine()
    .comment('Add the current directories contents to the container\'s /src directory')
    .copy('.', '.')
    .newLine()
    .comment('Define the default run command. Not actually ran on [docker build].')
    .comment('This command is only executed on [docker run].')
    .cmd([
      'npm',
      'run',
      dockerBuildType === validDockerBuildTypes.local ? 'dev' : 'start'
    ])
    ;

  if (dockerBuildType === validDockerBuildTypes.release) {
    dockerFile
      .newLine()
      .comment('Dockerfile metadata')
      .label(packageJson.name + '.version', packageJson.version)
      .label('os.hostname', os.hostname())
      .label('os.platform', os.platform())
      .label('os.arch', os.arch())
      .label('git.branch', gitInfo.branch)
      .label('git.commit', gitInfo.commit)
      .label('dockerfile.timestamp', now.format('x'))
      ;
  }

  dockerFile
    .newLine()
    .writeStream()
    .pipe(fs.createWriteStream(destPath))
    ;
}

function writeDockerComposeFile(version, dockerBuildType, destPath) {
  var yamlCfg = {};

  yamlCfg[serviceName] = {
    image: dockerImageTag,
    expose: [
      config.get('PORT')
    ],
    environment: [
      'PORT=' + config.get('PORT'),
      'HOST=' + config.get('HOST')
    ],
    volumes: [
      './app:/src/app'
    ]
  };

  yamlCfg.haproxy = {
    image: 'tutum/haproxy',
    links: [
      serviceName
    ],
    ports: [
      '80:80',
      '70:70'
    ],
    expose: [
      '80',
      '70'
    ]
  };

  fs
    .createReadStream(dockerIgnoreSrc.replace('{{dockerBuildType}}', dockerBuildType))
    .pipe(fs.createWriteStream(dockerIgnoreDest));

  fs.writeFileSync(destPath, yaml.stringify(yamlCfg));
}

function writePackageJsonDockerScripts(packageJson, destPath) {
  packageJson.scripts['docker:clean:image'] = 'docker images -q ' + dockerImageTag + ' | xargs docker rmi -f';
  packageJson.scripts['docker:build'] = 'docker build -t ' + dockerImageTag + ' -f ./Dockerfile .';
  packageJson.scripts['docker:up'] = 'docker-compose scale ' + serviceName + '=' + numberOfInstances + ' haproxy=1';

  fs.writeFileSync(destPath, JSON.stringify(packageJson, null, 2) + '\n');
}
