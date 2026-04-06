package ma.medsys.rdv.repository;

import ma.medsys.rdv.entity.WaitingListEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaitingListRepository extends JpaRepository<WaitingListEntry, Long> {

    List<WaitingListEntry> findByPatientId(Long patientId);

    Optional<WaitingListEntry> findFirstBySpecialiteIdOrMedecinIdOrderByPriorityDescDateAjoutAsc(
            Long specialiteId, Long medecinId);
}
