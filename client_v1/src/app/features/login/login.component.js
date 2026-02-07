import template from "./login.component.html";

class LoginController {
  login = {
    username: "",
    password: "",
  };
  constructor($http, $window, $location, loginService) {
    this.$http = $http;
    this.$window = $window;
    this.$location = $location;
    this.loginService = loginService;
  }

  async submit(form) {
    if (form.$invalid) {
      form.$setSubmitted();
      return;
    }

    try {
      const response = await this.loginService.submitLogin(this.login);
      this.loginService.saveToken(response.data.token);
      this.$window.location.href =
        this.$location.absUrl().split("/app")[0] + "/app/user";
    } catch (error) {
      form.password.$setValidity("wrongPassword", false);
    }
  }
}

LoginController.$inject = ["$http", "$window", "$location", "loginService"];

angular.module("app.login").component("login", {
  template: template,
  controller: LoginController,
});
