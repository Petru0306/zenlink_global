# Integrating React Dashboard with Spring Boot

## Recommended Approach for Design-First Workflow

Since you're building design first, then adding logic, here's the best strategy:

---

## Phase 1: Development Setup (Design First)

### 1. Copy React Dashboard to Your Project

```bash
# Make sure you're in your Spring Boot project root (e.g., ~/Downloads/zenlinkk)
cd ~/Downloads/zenlinkk  # or wherever your Spring Boot project is

# Create frontend directory
mkdir frontend

# Copy all files from the dashboard folder (adjust path if needed)
cp -r ~/Downloads/vision-ui-dashboard-react-main/* frontend/

# OR if you're already in Downloads folder:
# cp -r vision-ui-dashboard-react-main/* frontend/

# Alternative: Copy the entire folder first, then move contents
# cp -r ~/Downloads/vision-ui-dashboard-react-main ./frontend-temp
# mv frontend-temp/* frontend/
# rmdir frontend-temp  # Remove empty temp folder
```

### 2. Update React Package.json for API Proxy

In `frontend/package.json`, add a proxy to your Spring Boot backend:

```json
{
  "name": "vision-ui-dashboard-react",
  "version": "3.0.0",
  "private": true,
  "proxy": "http://localhost:8080",  // <-- ADD THIS LINE
  ...
}
```

This allows React dev server to proxy API calls to Spring Boot during development.

### 3. Configure Spring Boot for CORS (Development)

Create a CORS configuration in your Spring Boot project:

**File: `src/main/java/com/yourpackage/config/CorsConfig.java`**

```java
package com.yourpackage.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")  // Only API endpoints
                .allowedOrigins("http://localhost:3000")  // React dev server
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

### 4. Workflow During Design Phase

**Terminal 1 - Spring Boot:**
```bash
cd your-spring-boot-project
mvn spring-boot:run
# Runs on http://localhost:8080
```

**Terminal 2 - React (Design Work):**
```bash
cd your-spring-boot-project/frontend
npm install
npm start
# Runs on http://localhost:3000
```

**Benefits:**
- ✅ Fast React hot-reload for design changes
- ✅ Spring Boot runs independently
- ✅ Can work on design without touching backend
- ✅ Easy to test with mock data in React

---

## Phase 2: Integration for Production

### Option A: Manual Integration (Simple)

#### Step 1: Build React App

```bash
cd frontend
npm run build
```

This creates a `build/` directory with optimized static files.

#### Step 2: Copy Build to Spring Boot

```bash
# Copy React build to Spring Boot static resources
cp -r frontend/build/* src/main/resources/static/
```

#### Step 3: Configure Spring Boot to Serve React Router

**File: `src/main/java/com/yourpackage/config/WebConfig.java`**

```java
package com.yourpackage.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        // If the resource doesn't exist, serve index.html (for React Router)
                        return requestedResource.exists() && requestedResource.isReadable() 
                            ? requestedResource 
                            : new ClassPathResource("/static/index.html");
                    }
                });
    }
}
```

**File: `src/main/java/com/yourpackage/controller/ReactController.java`**

```java
package com.yourpackage.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ReactController {
    
    // Forward all non-API routes to React
    @GetMapping(value = {
        "/",
        "/dashboard",
        "/tables",
        "/billing",
        "/profile",
        "/authentication/sign-in",
        "/authentication/sign-up"
    })
    public String forwardToReact() {
        return "forward:/index.html";
    }
}
```

**Benefits:**
- ✅ Single deployment (one JAR file)
- ✅ React Router works correctly
- ✅ Same origin (no CORS issues in production)

---

### Option B: Maven Plugin Integration (Automated)

⚠️ **IMPORTANT**: The Maven plugin only builds React during `mvn package` or `mvn install` (build time), NOT during `mvn spring-boot:run` (runtime).

**For Development**: You MUST run `npm start` separately for hot-reload and design work.
**For Production**: The plugin automatically builds React and copies it to `static/` during `mvn package`.

Use Maven to automatically build React during `mvn package`:

**Add to your `pom.xml`:**

```xml
<build>
    <plugins>
        <!-- Your existing Spring Boot plugin -->
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
        
        <!-- Frontend Maven Plugin -->
        <plugin>
            <groupId>com.github.eirslett</groupId>
            <artifactId>frontend-maven-plugin</artifactId>
            <version>1.15.0</version>
            <configuration>
                <workingDirectory>frontend</workingDirectory>
                <installDirectory>target</installDirectory>
            </configuration>
            <executions>
                <!-- Install Node.js and npm -->
                <execution>
                    <id>install-node-and-npm</id>
                    <goals>
                        <goal>install-node-and-npm</goal>
                    </goals>
                    <configuration>
                        <nodeVersion>v18.17.0</nodeVersion>
                        <npmVersion>9.8.1</npmVersion>
                    </configuration>
                </execution>
                
                <!-- Install npm dependencies -->
                <execution>
                    <id>npm-install</id>
                    <goals>
                        <goal>npm</goal>
                    </goals>
                    <configuration>
                        <arguments>install</arguments>
                    </configuration>
                </execution>
                
                <!-- Build React app -->
                <execution>
                    <id>npm-build</id>
                    <goals>
                        <goal>npm</goal>
                    </goals>
                    <configuration>
                        <arguments>run build</arguments>
                    </configuration>
                </execution>
            </executions>
        </plugin>
        
        <!-- Copy React build to resources/static -->
        <plugin>
            <artifactId>maven-resources-plugin</artifactId>
            <executions>
                <execution>
                    <id>copy-react-build</id>
                    <phase>process-resources</phase>
                    <goals>
                        <goal>copy-resources</goal>
                    </goals>
                    <configuration>
                        <outputDirectory>${project.build.directory}/classes/static</outputDirectory>
                        <resources>
                            <resource>
                                <directory>frontend/build</directory>
                                <filtering>false</filtering>
                            </resource>
                        </resources>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

**Benefits:**
- ✅ Automatic React build during Maven package
- ✅ Single command: `mvn clean package`
- ✅ CI/CD friendly

---

## Phase 3: Connecting React to Spring Boot APIs (When Adding Logic)

### 1. Create API Endpoints in Spring Boot

**Example: `src/main/java/com/yourpackage/controller/DashboardController.java`**

```java
package com.yourpackage.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("todayMoney", "$53,000");
        stats.put("todayUsers", 2300);
        stats.put("newClients", 3462);
        stats.put("totalSales", "$103,430");
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/projects")
    public ResponseEntity<?> getProjects() {
        // Return your project data
        return ResponseEntity.ok(/* your data */);
    }
}
```

### 2. Create API Service in React

**File: `frontend/src/services/api.js`**

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Production: same origin
  : 'http://localhost:8080/api';  // Development: proxy to Spring Boot

export const dashboardAPI = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    return response.json();
  },
  
  getProjects: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/projects`);
    return response.json();
  }
};
```

### 3. Update Dashboard Component

**File: `frontend/src/layouts/dashboard/index.js`**

```javascript
import { useState, useEffect } from "react";
import { dashboardAPI } from "services/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace mock data with API call
    dashboardAPI.getStats()
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching stats:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <DashboardLayout>
      {/* Use stats from API instead of hardcoded values */}
      <MiniStatisticsCard
        title={{ text: "today's money" }}
        count={stats?.todayMoney || "$0"}
        // ... rest of component
      />
    </DashboardLayout>
  );
}
```

---

## Project Structure Summary

```
your-spring-boot-project/
├── pom.xml
├── src/
│   └── main/
│       ├── java/
│       │   └── com/yourpackage/
│       │       ├── config/
│       │       │   ├── CorsConfig.java        # CORS for dev
│       │       │   └── WebConfig.java         # Static file serving
│       │       ├── controller/
│       │       │   ├── DashboardController.java  # API endpoints
│       │       │   └── ReactController.java      # React Router forwarding
│       │       └── Application.java
│       └── resources/
│           └── static/                      # React build (production)
│               ├── index.html
│               ├── static/
│               └── ...
└── frontend/                                # React source (development)
    ├── package.json
    ├── src/
    │   ├── layouts/
    │   ├── components/
    │   ├── services/
    │   │   └── api.js                       # API service layer
    │   └── App.js
    └── build/                               # Built files (goes to static/)
```

---

## Quick Start Commands

### Development (Design First) - ALWAYS Separate
**⚠️ For development, you MUST run both commands (regardless of Option A or B):**

```bash
# Terminal 1: Spring Boot
mvn spring-boot:run
# Serves backend on http://localhost:8080

# Terminal 2: React (REQUIRED for development)
cd frontend && npm start
# Serves frontend on http://localhost:3000 with hot-reload
```

**Why separate?** 
- React dev server (`npm start`) provides fast hot-reload for design changes
- Spring Boot serves your backend APIs
- Proxy in `package.json` connects them together
- The Maven plugin does NOT run during `mvn spring-boot:run` - it only works during `mvn package`

### Production Build

**Option A: Manual**
```bash
cd frontend && npm run build
cp -r frontend/build/* src/main/resources/static/
mvn clean package
```

**Option B: Automatic (with Maven plugin)**
```bash
mvn clean package  # Builds React automatically during this step
# React build happens automatically, then Spring Boot packages everything
```

### Running Production Build
```bash
# After building (Option A or B):
java -jar target/your-app.jar
# Now React is served from Spring Boot on http://localhost:8080
# No separate npm start needed!
```

---

## Tips for Your Design-First Workflow

1. **Mock Data First**: Keep using mock data in React during design phase
2. **Separate Concerns**: Design in React, logic in Spring Boot
3. **API Design Later**: Design your API contracts when ready to add logic
4. **Environment Variables**: Use `.env` files for different environments
5. **Test Separately**: Test React UI separately, then integrate APIs

---

## Common Issues & Solutions

### Issue: React Router routes show 404 in production
**Solution**: Use the `ReactController` to forward routes to `index.html`

### Issue: API calls fail in production
**Solution**: Use relative paths (`/api/...`) instead of full URLs in production

### Issue: Maven build fails (no Node.js)
**Solution**: Use the frontend-maven-plugin (Option B) or build React manually first

### Issue: CORS errors in development
**Solution**: Ensure `CorsConfig` allows `http://localhost:3000` and React has proxy configured

