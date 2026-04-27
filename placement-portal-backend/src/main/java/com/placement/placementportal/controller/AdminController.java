package com.placement.placementportal.controller;

import com.placement.placementportal.model.Application;
import com.placement.placementportal.model.Internship;
import com.placement.placementportal.model.Resume;
import com.placement.placementportal.model.User;
import com.placement.placementportal.repository.ApplicationRepository;
import com.placement.placementportal.repository.InternshipRepository;
import com.placement.placementportal.repository.UserRepository;
import com.placement.placementportal.repository.ResumeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InternshipRepository internshipRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getAdminDashboardData() {
        Map<String, Object> data = new HashMap<>();

        // Metrics
        data.put("totalStudents", userRepository.countByRole("STUDENT"));
        data.put("totalCompanies", userRepository.countByRole("COMPANY"));
        data.put("totalOpportunities", internshipRepository.count());
        long placements = applicationRepository.countByStatus("Selected") + applicationRepository.countByStatus("Interview"); // Including interviews as positive activity
        data.put("totalPlacements", placements);

        // Fetch Users
        List<User> allUsers = userRepository.findAll();
        
        // Process Students and attach Skills
        List<Map<String, Object>> studentsData = allUsers.stream()
                .filter(u -> "STUDENT".equals(u.getRole()))
                .map(u -> {
                    Map<String, Object> studentMap = new HashMap<>();
                    studentMap.put("id", u.getId());
                    studentMap.put("name", u.getName());
                    studentMap.put("email", u.getEmail());
                    studentMap.put("role", u.getRole());
                    studentMap.put("department", u.getDepartment());
                    studentMap.put("cgpa", u.getCgpa());
                    studentMap.put("manualSkills", u.getSkills());
                    
                    // Fetch latest resume
                    Optional<Resume> resumeOpt = resumeRepository.findTopByStudentIdOrderByUploadedAtDesc(u.getId());
                    if (resumeOpt.isPresent()) {
                        Resume resume = resumeOpt.get();
                        studentMap.put("resumeUploadDate", resume.getUploadedAt());
                        if (resume.getExtractedSkills() != null && !resume.getExtractedSkills().isEmpty()) {
                            studentMap.put("skills", Arrays.asList(resume.getExtractedSkills().split("\\|")));
                        } else {
                            studentMap.put("skills", new ArrayList<>());
                        }
                    } else {
                        studentMap.put("resumeUploadDate", null);
                        studentMap.put("skills", new ArrayList<>());
                    }
                    return studentMap;
                })
                .collect(Collectors.toList());
                
        data.put("students", studentsData);
        data.put("companies", allUsers.stream().filter(u -> "COMPANY".equals(u.getRole())).collect(Collectors.toList()));
        data.put("internships", internshipRepository.findAll());
        
        // Fetch and sort applications by date descending (to act as activity feed)
        List<Application> allApplications = applicationRepository.findAll();
        allApplications.sort(Comparator.comparing(Application::getAppliedDate, Comparator.nullsLast(Comparator.reverseOrder())));
        data.put("applications", allApplications);

        return ResponseEntity.ok(data);
    }

    @org.springframework.web.bind.annotation.PutMapping("/student/{id}")
    public ResponseEntity<?> updateStudent(@org.springframework.web.bind.annotation.PathVariable Long id, @org.springframework.web.bind.annotation.RequestBody User studentDetails) {
        return userRepository.findById(id).map(student -> {
            student.setName(studentDetails.getName());
            student.setEmail(studentDetails.getEmail());
            student.setDepartment(studentDetails.getDepartment());
            student.setCgpa(studentDetails.getCgpa());
            student.setSkills(studentDetails.getSkills());
            userRepository.save(student);
            return ResponseEntity.ok("Student updated successfully");
        }).orElse(ResponseEntity.notFound().build());
    }

    @org.springframework.web.bind.annotation.PutMapping("/internship/{id}")
    public ResponseEntity<?> updateInternship(@org.springframework.web.bind.annotation.PathVariable Long id, @org.springframework.web.bind.annotation.RequestBody Internship internshipDetails) {
        return internshipRepository.findById(id).map(internship -> {
            internship.setRoleTitle(internshipDetails.getRoleTitle());
            internship.setCompanyName(internshipDetails.getCompanyName());
            internship.setDescription(internshipDetails.getDescription());
            internship.setStipend(internshipDetails.getStipend());
            internship.setCgpaLimit(internshipDetails.getCgpaLimit());
            internship.setEligibleDepts(internshipDetails.getEligibleDepts());
            internship.setRequiredSkills(internshipDetails.getRequiredSkills());
            internshipRepository.save(internship);
            return ResponseEntity.ok("Internship updated successfully");
        }).orElse(ResponseEntity.notFound().build());
    }

}
