package com.hospital.auth.repository;

import com.hospital.auth.entity.UserAccount;
import com.hospital.auth.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByEmail(String email);
    Optional<UserAccount> findByCin(String cin);
    Optional<UserAccount> findByResetToken(String token);
    boolean existsByEmail(String email);
    boolean existsByCin(String cin);
    List<UserAccount> findByRole(Role role);
}
