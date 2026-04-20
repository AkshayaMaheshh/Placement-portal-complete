package com.placement.placementportal.controller;

import com.placement.placementportal.model.Application;
import com.placement.placementportal.model.Internship;
import com.placement.placementportal.model.User;
import com.placement.placementportal.repository.ApplicationRepository;
import com.placement.placementportal.repository.InternshipRepository;
import com.placement.placementportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InternshipRepository internshipRepository;

    @PostMapping
    public Application createApplication(@RequestBody Application application) {
        if (application.getStudent() != null && application.getStudent().getId() != null) {
            Long studentId = application.getStudent().getId();
            User student = userRepository.findById(studentId).orElse(null);
            application.setStudent(student);
        }

        if (application.getInternship() != null && application.getInternship().getId() != null) {
            Long internshipId = application.getInternship().getId();
            Internship internship = internshipRepository.findById(internshipId).orElse(null);
            application.setInternship(internship);
        }

        return applicationRepository.save(application);
    }

    @GetMapping
    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    @GetMapping("/student/{studentId}")
    public List<Application> getApplicationsByStudent(@PathVariable Long studentId) {
        return applicationRepository.findByStudentId(studentId);
    }

    @GetMapping("/student/{studentId}/metrics")
    public Map<String, Integer> getStudentMetrics(@PathVariable Long studentId) {

        List<Application> applications = applicationRepository.findByStudentId(studentId);

        int totalApplications = applications.size();
        int applied = 0;
        int interviews = 0;
        int shortlisted = 0;
        int rejected = 0;

        for (Application app : applications) {
            if (app.getStatus() == null)
                continue;

            switch (app.getStatus()) {
                case "Applied":
                    applied++;
                    break;
                case "Interview":
                    interviews++;
                    break;
                case "Shortlisted":
                    shortlisted++;
                    break;
                case "Rejected":
                    rejected++;
                    break;
            }
        }

        Map<String, Integer> metrics = new HashMap<>();
        metrics.put("totalApplications", totalApplications);
        metrics.put("applied", applied);
        metrics.put("interviews", interviews);
        metrics.put("shortlisted", shortlisted);
        metrics.put("rejected", rejected);

        return metrics;
    }

    @GetMapping("/internship/{internshipId}")
    public List<Application> getApplicationsByInternship(@PathVariable Long internshipId) {
        return applicationRepository.findByInternshipId(internshipId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Application application = applicationRepository.findById(id).orElse(null);
        if (application == null) {
            return ResponseEntity.badRequest().body("Application not found!");
        }

        String newStatus = payload.get("status");
        if (newStatus != null) {
            application.setStatus(newStatus);
            applicationRepository.save(application);
            return ResponseEntity.ok(application);
        }

        return ResponseEntity.badRequest().body("Status cannot be null");
    }

    @PutMapping("/{applicationId}/status")
    public ResponseEntity<?> updateApplicationStatusById(@PathVariable Long applicationId,
            @RequestBody Map<String, String> payload) {
        Application application = applicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            return ResponseEntity.badRequest().body("Application not found!");
        }

        String newStatus = payload.get("status");
        if (newStatus != null) {
            application.setStatus(newStatus);
            applicationRepository.save(application);
            return ResponseEntity.ok(application);
        }

        return ResponseEntity.badRequest().body("Status cannot be null");
    }
}
