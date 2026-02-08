import "./interceptors/auth.interceptor";

(function () {
  "use strict";

  angular
    .module("app.core", ["ngRoute", "ngSanitize", "ngAnimate"])
    .config(configure);

  configure.$inject = ["$httpProvider"];

  function configure($httpProvider) {
    $httpProvider.interceptors.push("AuthInterceptor");
  }
})();
