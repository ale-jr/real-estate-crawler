module.exports = {
  apps: [{
    name: "real-estate-crawler",
    script: "./main.js",
    env: {
      "OPENSSL_CONF": "/dev/null"
    }
  }]
}
