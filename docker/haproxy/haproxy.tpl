global
  log 127.0.0.1 local0
  log 127.0.0.1 local1 notice
  maxconn 500

defaults
  log global
  mode http
  option httplog
  option dontlognull
  timeout connect 5000
  timeout client 10000
  timeout server 10000

frontend balancer
  bind 0.0.0.0:80
  mode http
  default_backend aj_backends

backend aj_backends
  mode http
  option forwardfor
  # http-request set-header X-Forwarded-Port %[dst_port]
  balance roundrobin
{{instances}}
  # option httpchk OPTIONS * HTTP/1.1\r\nHost:\ localhost
  option httpchk GET /heartbeat
  http-check expect status 200
