class LoginService {
  constructor(http) {
    this.http = http;
  }

  submitLogin(credentials) {
    return this.http.post("/api/login", {
      username: credentials.username,
      password: credentials.password,
    });
  }

  logout() {
    return this.http.post("/api/logout", {});
  }

  isAuthenticated() {
    return !!localStorage.getItem("authToken");
  }

  saveToken(token) {
    localStorage.setItem("authToken", token);
  }

  getToken() {
    return localStorage.getItem("authToken");
  }

  clearToken() {
    localStorage.removeItem("authToken");
  }
}

LoginService.$inject = ["$http"];

angular.module("app.login").service("loginService", LoginService);

export default LoginService;
