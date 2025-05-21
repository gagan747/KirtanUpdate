# API Client Usage

This directory contains the axios API client setup with interceptors to automatically manage server URLs.

## How to use the API client

Instead of using axios directly, import the `api` client from this directory:

```typescript
import api from "../lib/api";

// Example GET request
const fetchData = async () => {
  try {
    const response = await api.get("/users");
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Example POST request
const createUser = async (userData) => {
  try {
    const response = await api.post("/users", userData);
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};
```

## Benefits

1. Automatic server URL injection based on environment variables
2. Consistent error handling
3. Authentication handling (can be extended)
4. Request/response interceptors for global transformations

## Environment Variables

The API client uses these environment variables:

- `VITE_SERVER_URL` - The URL of the API server (defaults to http://localhost:5000)
