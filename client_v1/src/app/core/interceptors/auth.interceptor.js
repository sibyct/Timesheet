angular
  .module("app.core")
  .factory("AuthInterceptor", function ($q, $location, $localStorage) {
    return {
      // 1. Intercepting Requests (Adding a JWT)
      request: function (config) {
        config.headers = config.headers || {};
        if ($localStorage.token) {
          config.headers.Authorization = "Bearer " + $localStorage.token;
        }
        return config;
      },

      // 2. Intercepting Response Errors (Handling 401/403)
      responseError: function (rejection) {
        if (rejection.status === 401) {
          // If unauthorized, redirect to login
          $location.path("/login");
        }
        // Return the promise rejection so the caller can still catch it
        return $q.reject(rejection);
      },
    };
  });
