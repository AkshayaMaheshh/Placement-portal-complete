package com.placement.placementportal.controller;

import com.placement.placementportal.model.User;
import com.placement.placementportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.placement.placementportal.util.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.util.Collections;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // =========================
    // REGISTER API
    // =========================
    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody User user) {
        try {
            if (userRepository.findByEmail(user.getEmail()).isPresent()) {
                return ResponseEntity.badRequest().body("Email is already in use!");
            }

            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                return ResponseEntity.badRequest().body("Password cannot be empty!");
            }

            user.setPassword(passwordEncoder.encode(user.getPassword()));
            userRepository.save(user);
            return ResponseEntity.ok("User registered successfully!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // =========================
    // LOGIN API
    // =========================
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User loginRequest) {

        Optional<User> userOptional = userRepository.findByEmail(loginRequest.getEmail());

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        User user = userOptional.get();

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("id", user.getId());
        response.put("role", user.getRole());

        return ResponseEntity.ok(response);
    }

    // =========================
    // GOOGLE LOGIN API
    // =========================
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String idTokenString = request.get("token");
        
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                // Replace with your actual Client ID
                .setAudience(Collections.singletonList("YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com"))
                .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                return ResponseEntity.status(401).body("Invalid Google Token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            Optional<User> userOptional = userRepository.findByEmail(email);
            User user;

            if (userOptional.isPresent()) {
                user = userOptional.get();
            } else {
                // New User Registration from Google
                user = new User();
                user.setEmail(email);
                user.setName(name);
                user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString())); // Random password for OAuth users
                user.setRole("STUDENT"); // Default role

                // PARSING LOGIC for RIT Chennai Email
                // Format: student@dept.ritchennai.edu.in
                // Example: 21cse045@cse.ritchennai.edu.in
                String domain = email.substring(email.indexOf("@") + 1);
                if (domain.contains(".ritchennai.edu.in")) {
                    String[] domainParts = domain.split("\\.");
                    String dept = domainParts[0].toUpperCase();
                    user.setDepartment(dept);

                    String localPart = email.split("@")[0];
                    if (localPart.length() >= 2 && Character.isDigit(localPart.charAt(0))) {
                        // Assuming first 2 digits are joining year, e.g., 21 -> 2025 graduation
                        int startYear = Integer.parseInt(localPart.substring(0, 2));
                        user.setGraduationYear("20" + (startYear + 4));
                    }
                }
                userRepository.save(user);
            }

            String jwtToken = jwtUtil.generateToken(user.getId(), user.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("token", jwtToken);
            response.put("id", user.getId());
            response.put("role", user.getRole());
            response.put("name", user.getName());
            response.put("isNewUser", userOptional.isEmpty());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Google Authentication Error: " + e.getMessage());
        }
    }
}