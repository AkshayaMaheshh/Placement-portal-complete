package com.placement.placementportal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.placement.placementportal.model.Skill;
import com.placement.placementportal.model.User;
import com.placement.placementportal.repository.SkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SkillExtractionService {

    @Autowired
    private SkillRepository skillRepository;

    public Map<String, Object> extractSkills(String text, User student) {
        Map<String, Object> finalResult = new HashMap<>();
        Set<String> extractedSkillNames = new HashSet<>();
        List<String> organizations = new ArrayList<>();
        List<String> locations = new ArrayList<>();
        String summary = "Basic extraction performed.";

        try {
            // Write text to a temporary file
            File tempFile = File.createTempFile("resume_text", ".txt");
            try (FileWriter writer = new FileWriter(tempFile)) {
                writer.write(text);
            }

            // Path to the python script
            String pythonScriptPath = "python/resume_parser.py";
            // We assume python is in PATH
            ProcessBuilder pb = new ProcessBuilder("python", pythonScriptPath, tempFile.getAbsolutePath());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }

            process.waitFor();
            tempFile.delete();

            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(output.toString());
            
            if (rootNode.has("skills")) {
                for (JsonNode skillNode : rootNode.get("skills")) {
                    extractedSkillNames.add(skillNode.asText());
                }
            }
            if (rootNode.has("organizations")) {
                for (JsonNode orgNode : rootNode.get("organizations")) {
                    organizations.add(orgNode.asText());
                }
            }
            if (rootNode.has("locations")) {
                for (JsonNode locNode : rootNode.get("locations")) {
                    locations.add(locNode.asText());
                }
            }
            if (rootNode.has("summary")) {
                summary = rootNode.get("summary").asText();
            }

        } catch (Exception e) {
            System.err.println("Error running SpaCy parser. Fallback to none.");
            e.printStackTrace();
        }

        List<Skill> existingSkills = skillRepository.findByStudentId(student.getId());
        Set<String> existingSkillNames = existingSkills.stream()
                .map(s -> s.getName().toLowerCase())
                .collect(Collectors.toSet());

        List<String> newSkillsToReturn = new ArrayList<>();

        for (String skillName : extractedSkillNames) {
            if (!existingSkillNames.contains(skillName.toLowerCase())) {
                Skill newSkill = new Skill();
                newSkill.setName(skillName);
                newSkill.setStudent(student);
                skillRepository.save(newSkill);
                newSkillsToReturn.add(skillName);
            } else {
                newSkillsToReturn.add(skillName);
            }
        }

        finalResult.put("skillsExtracted", newSkillsToReturn.stream().distinct().collect(Collectors.toList()));
        finalResult.put("organizations", organizations);
        finalResult.put("locations", locations);
        finalResult.put("summary", summary);

        return finalResult;
    }
}
