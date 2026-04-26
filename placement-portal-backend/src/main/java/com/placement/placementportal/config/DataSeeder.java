package com.placement.placementportal.config;

import com.placement.placementportal.model.Application;
import com.placement.placementportal.model.Internship;
import com.placement.placementportal.model.User;
import com.placement.placementportal.repository.ApplicationRepository;
import com.placement.placementportal.repository.InternshipRepository;
import com.placement.placementportal.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner loadData(UserRepository userRepository, InternshipRepository internshipRepository, ApplicationRepository applicationRepository) {
        return args -> {
            System.out.println("Current application count: " + applicationRepository.count());
            long rand = System.currentTimeMillis();
                
                // Create Dummy Students
                User student1 = new User(null, "Alice Johnson", "alice" + rand + "@example.com", "password", "STUDENT");
                User student2 = new User(null, "Bob Smith", "bob" + rand + "@example.com", "password", "STUDENT");
                User student3 = new User(null, "Charlie Davis", "charlie" + rand + "@example.com", "password", "STUDENT");
                
                userRepository.saveAll(Arrays.asList(student1, student2, student3));

                // Create Dummy Companies
                User company1 = new User(null, "Tech Corp", "hr" + rand + "@techcorp.com", "password", "COMPANY");
                User company2 = new User(null, "Innovate LLC", "careers" + rand + "@innovatellc.com", "password", "COMPANY");
                
                userRepository.saveAll(Arrays.asList(company1, company2));

                // Create Dummy Internships
                Internship internship1 = new Internship(null, "Tech Corp", "Software Engineering Intern", "Develop amazing software.", "Remote", "Java, Spring Boot", 50000.0);
                internship1.setType("INTERNSHIP");
                internship1.setCgpaLimit(7.5);
                internship1.setEligibleDepts("CSE, IT");
                
                Internship internship2 = new Internship(null, "Innovate LLC", "Frontend Developer", "Build amazing UIs.", "New York", "React, JavaScript", 60000.0);
                internship2.setType("JOB");
                internship2.setCgpaLimit(8.0);
                internship2.setEligibleDepts("CSE");

                internshipRepository.saveAll(Arrays.asList(internship1, internship2));

                // Create Dummy Applications
                Application app1 = new Application(null, student1, internship1, "Applied", java.time.LocalDate.now().minusDays(5));
                Application app2 = new Application(null, student2, internship1, "Selected", java.time.LocalDate.now().minusDays(3));
                Application app3 = new Application(null, student3, internship2, "Interview", java.time.LocalDate.now().minusDays(1));
                Application app4 = new Application(null, student1, internship2, "Applied", java.time.LocalDate.now());

                applicationRepository.saveAll(Arrays.asList(app1, app2, app3, app4));
                System.out.println("Dummy Data Seeded Successfully!");
        };
    }
}
