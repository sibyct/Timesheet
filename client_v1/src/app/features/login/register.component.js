import template from "./register.component.html";
import "./resister.component.css";

class RegisterController {
  user = {
    email: "",
    password: "",
    reenterPassword: "",
    firstName: "",
    lastName: "",
  };
  error = "";
  constructor(loginService, $state) {
    this.loginService = loginService;
    this.$state = $state;
  }
  async submit(form) {
    this.error = "";
    if (this.user.password !== this.user.reenterPassword) {
      this.error = "Passwords do not match";
      return;
    }
    // Stop if form is invalid
    if (form.$invalid) {
      return;
    }

    try {
      await this.loginService.register(this.user);
      // Redirect to login page after successful registration
      this.$state.go("login");
    } catch (error) {
      this.error = "Registration failed. Please try again.";
    }
  }
}

angular.module("app.login").component("register", {
  template: template,
  controller: RegisterController,
});
