import template from "./login.component.html";

class LoginController {
  login = {
    username: "",
    password: "",
  };
  constructor($http, $window, $location) {
    this.$http = $http;
    this.$window = $window;
    this.$location = $location;
  }

  loginBtnClick(form) {
    if (form.$invalid) {
      form.$setSubmitted();
      return;
    }
  }
}

LoginController.$inject = ["$http", "$window", "$location"];

angular.module("app.login").component("login", {
  template: template,
  controller: LoginController,
});
