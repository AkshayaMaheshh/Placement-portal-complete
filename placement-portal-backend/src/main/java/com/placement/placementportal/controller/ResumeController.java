package com.placement.placementportal.controller;

import com.placement.placementportal.model.Resume;
import com.placement.placementportal.model.User;
import com.placement.placementportal.repository.ResumeRepository;
import com.placement.placementportal.repository.UserRepository;
import com.placement.placementportal.service.ResumeParserService;
import com.placement.placementportal.service.SkillExtractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Arrays;

@RestController
@RequestMapping("/api/resume")
@CrossOrigin(origins = "*")
public class ResumeController {

    @Autowired
    private ResumeParserService resumeParserService;

    @Autowired
    private SkillExtractionService skillExtractionService;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private UserRepository userRepository;

    private final String UPLOAD_DIR = "uploads/resumes/";

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadResume(
            @RequestParam("resume") MultipartFile file,
            @RequestParam("studentId") Long studentId) {

        Map<String, Object> response = new HashMap<>();

        if (file.isEmpty()) {
            response.put("error", "Please select a file to upload");
            return ResponseEntity.badRequest().body(response);
        }

        if (!file.getContentType().equals("application/pdf")) {
            response.put("error", "Only PDF files are allowed");
            return ResponseEntity.badRequest().body(response);
        }

        Optional<User> studentOptional = userRepository.findById(studentId);
        if (studentOptional.isEmpty()) {
            response.put("error", "Student not found with ID: " + studentId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        User student = studentOptional.get();

        try {
            // Ensure upload directory exists
            File directory = new File(UPLOAD_DIR);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Save file to server
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(UPLOAD_DIR + fileName);
            Files.write(filePath, file.getBytes());

            // Store metadata in Resume table
            Resume resume = new Resume();
            resume.setFileName(file.getOriginalFilename());
            resume.setFilePath(filePath.toString());
            resume.setUploadedAt(LocalDateTime.now());
            resume.setStudent(student);
            resumeRepository.save(resume);

            // Parse resume and extract skills
            String extractedText = resumeParserService.extractText(file);
            Map<String, Object> extractionResult = skillExtractionService.extractSkills(extractedText, student);

            // Store extracted arrays to Resume DB Object properly formatted
            List<String> skillsList = (List<String>) extractionResult.get("skillsExtracted");
            List<String> orgsList = (List<String>) extractionResult.get("organizations");
            List<String> locsList = (List<String>) extractionResult.get("locations");

            if (skillsList != null && !skillsList.isEmpty()) resume.setExtractedSkills(String.join("|", skillsList));
            if (orgsList != null && !orgsList.isEmpty()) resume.setExtractedOrganizations(String.join("|", orgsList));
            if (locsList != null && !locsList.isEmpty()) resume.setExtractedLocations(String.join("|", locsList));
            resume.setSummary((String) extractionResult.getOrDefault("summary", "No adequate summary parsed."));

            resumeRepository.save(resume);

            // Send standard JS mappings back
            response.put("message", "Resume parsed successfully");
            response.put("skills", skillsList);
            response.put("organizations", orgsList);
            response.put("locations", locsList);
            response.put("summary", resume.getSummary());

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            response.put("error", "Error occurred during file processing: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getStudentResumeData(@PathVariable Long studentId) {
        Map<String, Object> response = new HashMap<>();

        Optional<Resume> resumeOptional = resumeRepository.findTopByStudentIdOrderByUploadedAtDesc(studentId);
        if (resumeOptional.isEmpty()) {
            response.put("error", "No resume data found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        Resume resume = resumeOptional.get();
        response.put("summary", resume.getSummary());
        
        response.put("skills", resume.getExtractedSkills() != null && !resume.getExtractedSkills().isEmpty() 
            ? Arrays.asList(resume.getExtractedSkills().split("\\|")) 
            : Arrays.asList());
        
        response.put("organizations", resume.getExtractedOrganizations() != null && !resume.getExtractedOrganizations().isEmpty() 
            ? Arrays.asList(resume.getExtractedOrganizations().split("\\|")) 
            : Arrays.asList());
        
        response.put("locations", resume.getExtractedLocations() != null && !resume.getExtractedLocations().isEmpty() 
            ? Arrays.asList(resume.getExtractedLocations().split("\\|")) 
            : Arrays.asList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/download/{studentId}")
    public ResponseEntity<Resource> downloadResume(@PathVariable Long studentId) {
        Optional<Resume> resumeOptional = resumeRepository.findTopByStudentIdOrderByUploadedAtDesc(studentId);
        if (resumeOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resume resume = resumeOptional.get();
        try {
            Path file = Paths.get(resume.getFilePath());
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resume.getFileName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
