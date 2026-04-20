package com.placement.placementportal.repository;

import com.placement.placementportal.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Optional<Resume> findTopByStudentIdOrderByUploadedAtDesc(Long studentId);
}
