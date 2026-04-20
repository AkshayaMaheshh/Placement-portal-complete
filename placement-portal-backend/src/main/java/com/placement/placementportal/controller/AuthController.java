package com.placement.placementportal.controller;

import com.placement.placementportal.model.User;
import com.placement.placementportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.placement.placementportal.util.JwtUtil;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

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

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email is already in use!");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
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
}