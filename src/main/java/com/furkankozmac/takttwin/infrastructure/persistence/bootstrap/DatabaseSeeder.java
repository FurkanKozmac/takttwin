package com.furkankozmac.takttwin.infrastructure.persistence.bootstrap;

import com.furkankozmac.takttwin.core.domain.model.Role;
import com.furkankozmac.takttwin.core.domain.model.WorkType;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.StationEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.UserEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.entity.WorkElementEntity;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.StationJpaRepository;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.UserJpaRepository;
import com.furkankozmac.takttwin.infrastructure.persistence.repository.WorkElementJpaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserJpaRepository userRepository;
    private final StationJpaRepository stationRepository;
    private final WorkElementJpaRepository workElementRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.furkankozmac.takttwin.infrastructure.persistence.repository.MaterialJpaRepository materialRepository;

    public DatabaseSeeder(UserJpaRepository userRepository,
                          StationJpaRepository stationRepository,
                          WorkElementJpaRepository workElementRepository,
                          PasswordEncoder passwordEncoder,
                          com.furkankozmac.takttwin.infrastructure.persistence.repository.MaterialJpaRepository materialRepository) {
        this.userRepository = userRepository;
        this.stationRepository = stationRepository;
        this.workElementRepository = workElementRepository;
        this.passwordEncoder = passwordEncoder;
        this.materialRepository = materialRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        seedUsers();
        seedStationsAndWorkElements();
        seedMaterials();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            // Admin: admin@tmmt.com
            UserEntity admin = UserEntity.builder()
                    .email("admin@tmmt.com")
                    .password(passwordEncoder.encode("mysecurepassword123"))
                    .role(Role.ROLE_ADMIN)
                    .build();
            userRepository.save(admin);

            // HSE Specialist: isguzmani@example.com
            UserEntity hse = UserEntity.builder()
                    .email("isguzmani@example.com")
                    .password(passwordEncoder.encode("mysecurepassword123"))
                    .role(Role.ROLE_HSE_SPECIALIST)
                    .build();
            userRepository.save(hse);

            // Operator: operator1@tmmt.com
            UserEntity operator = UserEntity.builder()
                    .email("operator1@tmmt.com")
                    .password(passwordEncoder.encode("mysecurepassword123"))
                    .role(Role.ROLE_OPERATOR)
                    .build();
            userRepository.save(operator);
        }
    }

    private void seedStationsAndWorkElements() {
        if (stationRepository.count() == 0) {
            // Station 1: Trim-1
            StationEntity trim1 = StationEntity.builder()
                    .name("Trim-1")
                    .taktTime(60.0)
                    .workElements(new ArrayList<>())
                    .build();
            stationRepository.save(trim1);

            saveWorkElement("Kablo Demeti Serimi", 18.0, WorkType.MANUAL, true, trim1);
            saveWorkElement("Torpido Grubu Montaji", 22.0, WorkType.MANUAL, true, trim1);
            saveWorkElement("Koltuk Tabani Civatalama", 12.0, WorkType.MANUAL, true, trim1);
            saveWorkElement("Hatta Adim Atma (Yurume)", 5.0, WorkType.WORKING, false, trim1);

            // Station 2: Trim-2
            StationEntity trim2 = StationEntity.builder()
                    .name("Trim-2")
                    .taktTime(60.0)
                    .workElements(new ArrayList<>())
                    .build();
            stationRepository.save(trim2);

            saveWorkElement("Yakit Deposu Montaji", 25.0, WorkType.MANUAL, true, trim2);
            saveWorkElement("Egzoz Sistemi Sabitleme", 20.0, WorkType.MANUAL, true, trim2);
            saveWorkElement("Fren Borulari Yerlesimi", 13.0, WorkType.MANUAL, true, trim2);

            // Station 3: Chassis-1
            StationEntity chassis1 = StationEntity.builder()
                    .name("Chassis-1")
                    .taktTime(60.0)
                    .workElements(new ArrayList<>())
                    .build();
            stationRepository.save(chassis1);

            saveWorkElement("Motor Grubu Kaldirma", 15.0, WorkType.MACHINE, true, chassis1);
            saveWorkElement("Aks ve Suspansiyon Baglantisi", 28.0, WorkType.MANUAL, true, chassis1);
            saveWorkElement("Robot Sikma Onayi Bekleme", 14.0, WorkType.WAITING, false, chassis1);

            // Station 4: Chassis-2
            StationEntity chassis2 = StationEntity.builder()
                    .name("Chassis-2")
                    .taktTime(60.0)
                    .workElements(new ArrayList<>())
                    .build();
            stationRepository.save(chassis2);

            saveWorkElement("Yag ve Antifriz Dolumu", 24.0, WorkType.MACHINE, true, chassis2);
            saveWorkElement("Dort Lastik Montaji", 20.0, WorkType.MANUAL, true, chassis2);
            saveWorkElement("Lastik Sikma Robotu", 12.0, WorkType.MACHINE, true, chassis2);

            // Station 5: Final-1
            StationEntity final1 = StationEntity.builder()
                    .name("Final-1")
                    .taktTime(60.0)
                    .workElements(new ArrayList<>())
                    .build();
            stationRepository.save(final1);

            saveWorkElement("On ve Arka Tampon Montaji", 22.0, WorkType.MANUAL, true, final1);
            saveWorkElement("On Cam Yapistirma", 18.0, WorkType.MACHINE, true, final1);
            saveWorkElement("Kapi Ayarlarinin Yapilmasi", 15.0, WorkType.MANUAL, true, final1);

            // Station 6: Inspection
            StationEntity inspection = StationEntity.builder()
                    .name("Inspection")
                    .taktTime(60.0)
                    .workElements(new ArrayList<>())
                    .build();
            stationRepository.save(inspection);

            saveWorkElement("Fren ve Roller Testi", 25.0, WorkType.MACHINE, true, inspection);
            saveWorkElement("Su Sizdirmazlik Testi", 15.0, WorkType.MACHINE, true, inspection);
            saveWorkElement("Gorsel Boya ve Panel Kontrolu", 18.0, WorkType.MANUAL, true, inspection);
        }
    }

    private void saveWorkElement(String name, Double duration, WorkType type, boolean isValueAdded, StationEntity station) {
        WorkElementEntity element = WorkElementEntity.builder()
                .name(name)
                .standardDuration(duration)
                .workType(type)
                .isValueAdded(isValueAdded)
                .station(station)
                .build();
        workElementRepository.save(element);
        station.getWorkElements().add(element);
    }

    private void seedMaterials() {
        if (materialRepository.count() == 0) {
            com.furkankozmac.takttwin.infrastructure.persistence.entity.MaterialEntity cockpit = com.furkankozmac.takttwin.infrastructure.persistence.entity.MaterialEntity.builder()
                    .name("Cockpit Unit")
                    .stockQuantity(12)
                    .minThreshold(3)
                    .build();
            materialRepository.save(cockpit);

            com.furkankozmac.takttwin.infrastructure.persistence.entity.MaterialEntity fuelTank = com.furkankozmac.takttwin.infrastructure.persistence.entity.MaterialEntity.builder()
                    .name("Fuel Tank")
                    .stockQuantity(15)
                    .minThreshold(4)
                    .build();
            materialRepository.save(fuelTank);

            com.furkankozmac.takttwin.infrastructure.persistence.entity.MaterialEntity wheelTire = com.furkankozmac.takttwin.infrastructure.persistence.entity.MaterialEntity.builder()
                    .name("Wheel Tire")
                    .stockQuantity(48)
                    .minThreshold(12)
                    .build();
            materialRepository.save(wheelTire);

            com.furkankozmac.takttwin.infrastructure.persistence.entity.MaterialEntity windshield = com.furkankozmac.takttwin.infrastructure.persistence.entity.MaterialEntity.builder()
                    .name("Windshield Glass")
                    .stockQuantity(10)
                    .minThreshold(3)
                    .build();
            materialRepository.save(windshield);

            linkMaterialToWorkElement("Torpido Grubu Montaji", cockpit.getId(), 1);
            linkMaterialToWorkElement("Yakit Deposu Montaji", fuelTank.getId(), 1);
            linkMaterialToWorkElement("Dort Lastik Montaji", wheelTire.getId(), 4);
            linkMaterialToWorkElement("On Cam Yapistirma", windshield.getId(), 1);
        }
    }

    private void linkMaterialToWorkElement(String name, Long materialId, int consumption) {
        workElementRepository.findAll().stream()
                .filter(el -> el.getName().equalsIgnoreCase(name))
                .findFirst()
                .ifPresent(el -> {
                    el.setMaterialId(materialId);
                    el.setMaterialConsumptionQuantity(consumption);
                    workElementRepository.save(el);
                });
    }
}
