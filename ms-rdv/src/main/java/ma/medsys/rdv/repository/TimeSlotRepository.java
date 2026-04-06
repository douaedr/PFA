package ma.medsys.rdv.repository;

import ma.medsys.rdv.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    List<TimeSlot> findByMedecinIdAndDisponibleTrue(Long medecinId);

    List<TimeSlot> findBySpecialiteIdAndDisponibleTrueAndDebutBetween(
            Long specialiteId, LocalDateTime from, LocalDateTime to);

    List<TimeSlot> findByMedecinIdAndDisponibleTrueAndDebutBetween(
            Long medecinId, LocalDateTime from, LocalDateTime to);

    // Recently freed slots (disponible=false but debut in the future — used when looking for cancelled slots to reassign)
    List<TimeSlot> findByDisponibleFalseAndDebutAfter(LocalDateTime from);
}
