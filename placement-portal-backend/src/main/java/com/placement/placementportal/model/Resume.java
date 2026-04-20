package com.placement.placementportal.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String filePath;
    private LocalDateTime uploadedAt;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String extractedSkills;
    
    @Column(columnDefinition = "TEXT")
    private String extractedOrganizations;

    @Column(columnDefinition = "TEXT")
    private String extractedLocations;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id")
    private User student;

    public Resume() {
    }

    public Resume(Long id, String fileName, String filePath, LocalDateTime uploadedAt, User student) {
        this.id = id;
        this.fileName = fileName;
        this.filePath = filePath;
        this.uploadedAt = uploadedAt;
        this.student = student;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getExtractedSkills() {
        return extractedSkills;
    }

    public void setExtractedSkills(String extractedSkills) {
        this.extractedSkills = extractedSkills;
    }

    public String getExtractedOrganizations() {
        return extractedOrganizations;
    }

    public void setExtractedOrganizations(String extractedOrganizations) {
        this.extractedOrganizations = extractedOrganizations;
    }

    public String getExtractedLocations() {
        return extractedLocations;
    }

    public void setExtractedLocations(String extractedLocations) {
        this.extractedLocations = extractedLocations;
    }
}
