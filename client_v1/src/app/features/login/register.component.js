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
  constructor(loginService) {
    this.loginService = loginService;
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
    } catch (error) {
      this.error = "Registration failed. Please try again.";
    }
  }
}

angular.module("app.login").component("register", {
  template: template,
  controller: RegisterController,
});
