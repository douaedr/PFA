package ma.medsys.rdv.repository;

import ma.medsys.rdv.entity.Appointment;
import ma.medsys.rdv.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientId(Long patientId);

    List<Appointment> findByMedecinId(Long medecinId);

    List<Appointment> findByMedecinIdAndStatus(Long medecinId, AppointmentStatus status);

    List<Appointment> findByDateHeureBetween(LocalDateTime start, LocalDateTime end);

    List<Appointment> findByPatientIdAndStatus(Long patientId, AppointmentStatus status);

    long countByMedecinIdAndDateHeureBetween(Long medecinId, LocalDateTime start, LocalDateTime end);

    List<Appointment> findByStatus(AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE DATE(a.dateHeure) = :date")
    List<Appointment> findByDate(@Param("date") LocalDate date);

    @Query("SELECT a.patientId, COUNT(a) as noShowCount FROM Appointment a WHERE a.status = 'NO_SHOW' " +
           "GROUP BY a.patientId HAVING COUNT(a) >= :threshold")
    List<Object[]> findPatientIdsWithNoShowAbove(@Param("threshold") int threshold);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.medecinId = :medecinId AND DATE(a.dateHeure) = :date")
    long countByMedecinAndDate(@Param("medecinId") Long medecinId, @Param("date") LocalDate date);
}
