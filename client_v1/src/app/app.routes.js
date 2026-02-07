angular.module("app").config(($routeProvider, $locationProvider) => {
  $locationProvider.hashPrefix("");

  $routeProvider
    .when("/login", {
      template: "<login></login>",
    })
    .when("/register", {
      template: "<register></register>",
    })
    .when("/main", {
      template: "<layout></layout>",
    })
    .otherwise({
      redirectTo: "/login",
    });
});
