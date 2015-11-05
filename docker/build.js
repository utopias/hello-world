var fs = require('fs');
var os = require('os');
var path = require('path');
var url = require('url');

var moment = require('moment');
var request = require('request');
var semver = require('semver');
var yaml = require('json2yaml');
var _ = require('lodash');
var replacestream = require('replacestream');

var config = require(path.join(__dirname, '../app/server/helpers/config'));
var packageJsonFileDest = path.join(__dirname, '../package.json');
var dockerFileDest = path.join(__dirname, '../Dockerfile');
var dockerComposeFileDest = path.join(__dirname, '../docker-compose.yml');
var gitInfo = require('../.git.json');
var dockerIgnoreReadPath = path.join(__dirname, './app/{{dockerBuildType}}/.dockerignore');
var dockerIgnoreWritePath = path.join(__dirname, '../.dockerignore');
var haproxyConfigTemplatePath = path.join(__dirname, './haproxy/haproxy.tpl');
var haproxyConfigWritePath = path.join(__dirname, './haproxy/haproxy.cfg');

var dfBuilder = require('node-dockerfile');
var dockerFile = new dfBuilder();
var packageJson = require(packageJsonFileDest);

var reqOpts = {
  uri: 'https://semver.io/node.json',
  json: true
};

request.get(reqOpts, function(err, res) {
  var semversions = res.body;
  var version = config.get('DOCKER_FORCE_NODE_VERSION') || semver.maxSatisfying(semversions.stableVersions, packageJson.engines.node);
  var validDockerBuildTypes = {
    local: 'local',
    release: 'release'
  };
  var dockerImageTag = getDockerImageTag(packageJson);
  var dockerBuildType = validDockerBuildTypes[(process.env.DOCKER_BUILD_TYPE || '').toLowerCase()] || validDockerBuildTypes.local;

  writeDockerFile(version, dockerBuildType, validDockerBuildTypes, dockerFileDest);
  writeDockerComposeFile(version, dockerBuildType, dockerImageTag, dockerComposeFileDest);
  writePackageJsonDockerScripts(packageJson, dockerImageTag, packageJsonFileDest);
});

function getDockerImageTag(packageJson) {
  var urlObj = url.parse(packageJson.repository.url);
  var imageName = urlObj.pathname.replace('/', '');

  return imageName + ':' + packageJson.version;
}

function getDockerContainerName(tag) {
  var inverse = /([^\w.-])/gi;

  return tag.replace(inverse, '_');
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

function writeDockerComposeFile(version, dockerBuildType, dockerImageTag, destPath) {
  var numberOfInstances = parseInt(config.get('DOCKER_APP_INSTANCES'), 0) || 1;
  var yamlCfg = {};
  var haproxyInstances = [];

  _.times(numberOfInstances, function(n) {
    yamlCfg['service_' + n] = {
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
  });

  yamlCfg.haproxy = {
    image: 'haproxy',
    links: _.keys(yamlCfg),
    ports: [
      '80:80',
      '70:70'
    ],
    expose: [
      '80',
      '70'
    ],
    volumes: [
      './docker/haproxy:/usr/local/etc/haproxy'
    ]
  };

  fs
    .createReadStream(dockerIgnoreReadPath.replace('{{dockerBuildType}}', dockerBuildType))
    .pipe(fs.createWriteStream(dockerIgnoreWritePath));

  fs.writeFileSync(destPath, yaml.stringify(yamlCfg));

  haproxyInstances = _.map(yamlCfg.haproxy.links, function(instance) {
    return '  server ' + instance + ' ' + instance + ':' + config.get('PORT') + ' check';
  });

  fs
    .createReadStream(haproxyConfigTemplatePath)
    .pipe(replacestream('{{instances}}', haproxyInstances.join('\n')))
    .pipe(fs.createWriteStream(haproxyConfigWritePath))
    ;
}

function writePackageJsonDockerScripts(packageJson, dockerImageTag, destPath) {
  packageJson.scripts['docker:clean:image'] = 'docker images -q ' + dockerImageTag + ' | xargs docker rmi -f';
  packageJson.scripts['docker:build'] = 'docker build -t ' + dockerImageTag + ' -f ./Dockerfile .';

  fs.writeFileSync(destPath, JSON.stringify(packageJson, null, 2) + '\n');
}
