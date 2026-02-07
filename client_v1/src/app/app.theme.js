angular.module("app").config(($mdThemingProvider) => {
  $mdThemingProvider
    .theme("default")
    .primaryPalette("indigo")
    .accentPalette("pink");
});
