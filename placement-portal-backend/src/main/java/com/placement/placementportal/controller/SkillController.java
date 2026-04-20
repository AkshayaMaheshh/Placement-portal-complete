package com.placement.placementportal.controller;

import com.placement.placementportal.model.Skill;
import com.placement.placementportal.model.User;
import com.placement.placementportal.repository.SkillRepository;
import com.placement.placementportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/skills")
public class SkillController {

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createSkill(@RequestBody Skill skill) {
        if (skill.getStudent() != null && skill.getStudent().getId() != null) {
            Long studentId = skill.getStudent().getId();
            User student = userRepository.findById(studentId).orElse(null);

            if (student == null) {
                return ResponseEntity.badRequest().body("Student not found!");
            }

            skill.setStudent(student);
        } else {
            return ResponseEntity.badRequest().body("Student ID must be provided!");
        }

        Skill savedSkill = skillRepository.save(skill);
        return ResponseEntity.ok(savedSkill);
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Skill>> getSkillsByStudent(@PathVariable Long studentId) {
        List<Skill> skills = skillRepository.findByStudentId(studentId);
        return ResponseEntity.ok(skills);
    }
}
