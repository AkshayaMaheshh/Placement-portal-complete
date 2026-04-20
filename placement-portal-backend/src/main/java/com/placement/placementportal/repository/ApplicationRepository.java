package com.placement.placementportal.repository;

import com.placement.placementportal.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByStudentId(Long studentId);

    List<Application> findByInternshipId(Long internshipId);
    long countByStatus(String status);
}
