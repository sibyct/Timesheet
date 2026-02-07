angular.module("app").config(($routeProvider, $locationProvider) => {
  $locationProvider.hashPrefix("");

  $routeProvider.when("/login", {
    template: "<login></login>",
  });
});
