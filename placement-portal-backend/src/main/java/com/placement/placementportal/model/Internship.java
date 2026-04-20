package com.placement.placementportal.model;

import jakarta.persistence.*;

@Entity
@Table(name = "internships")
public class Internship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String companyName;
    private String roleTitle;

    @Column(length = 1000)
    private String description;

    private String location;
    private String requiredSkills;
    private Double stipend;
    
    // New fields for Job/Internship classification and filtering
    private String type; // "INTERNSHIP" or "JOB"
    private Double cgpaLimit;
    private String eligibleDepts;

    public Internship() {
    }

    public Internship(Long id, String companyName, String roleTitle, String description, String location,
            String requiredSkills, Double stipend) {
        this.id = id;
        this.companyName = companyName;
        this.roleTitle = roleTitle;
        this.description = description;
        this.location = location;
        this.requiredSkills = requiredSkills;
        this.stipend = stipend;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getRoleTitle() {
        return roleTitle;
    }

    public void setRoleTitle(String roleTitle) {
        this.roleTitle = roleTitle;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getRequiredSkills() {
        return requiredSkills;
    }

    public void setRequiredSkills(String requiredSkills) {
        this.requiredSkills = requiredSkills;
    }

    public Double getStipend() {
        return stipend;
    }

    public void setStipend(Double stipend) {
        this.stipend = stipend;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Double getCgpaLimit() {
        return cgpaLimit;
    }

    public void setCgpaLimit(Double cgpaLimit) {
        this.cgpaLimit = cgpaLimit;
    }

    public String getEligibleDepts() {
        return eligibleDepts;
    }

    public void setEligibleDepts(String eligibleDepts) {
        this.eligibleDepts = eligibleDepts;
    }
}
