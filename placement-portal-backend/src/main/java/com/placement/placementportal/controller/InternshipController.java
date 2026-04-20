package com.placement.placementportal.controller;

import com.placement.placementportal.model.Internship;
import com.placement.placementportal.repository.InternshipRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/internships")
public class InternshipController {

    @Autowired
    private InternshipRepository internshipRepository;

    @PostMapping
    public Internship createInternship(@RequestBody Internship internship) {
        return internshipRepository.save(internship);
    }

    @GetMapping
    public List<Internship> getAllInternships() {
        return internshipRepository.findAll();
    }

    @PutMapping("/{id}")
    public Internship updateInternship(@PathVariable Long id, @RequestBody Internship internshipDetails) {
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Internship not found"));
        
        internship.setCompanyName(internshipDetails.getCompanyName());
        internship.setRoleTitle(internshipDetails.getRoleTitle());
        internship.setDescription(internshipDetails.getDescription());
        internship.setLocation(internshipDetails.getLocation());
        internship.setRequiredSkills(internshipDetails.getRequiredSkills());
        internship.setStipend(internshipDetails.getStipend());
        internship.setType(internshipDetails.getType());
        internship.setCgpaLimit(internshipDetails.getCgpaLimit());
        internship.setEligibleDepts(internshipDetails.getEligibleDepts());

        return internshipRepository.save(internship);
    }

    @DeleteMapping("/{id}")
    public void deleteInternship(@PathVariable Long id) {
        internshipRepository.deleteById(id);
    }
}
