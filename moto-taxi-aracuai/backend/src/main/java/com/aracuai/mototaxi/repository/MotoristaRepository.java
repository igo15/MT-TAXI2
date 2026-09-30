package com.aracuai.mototaxi.repository;

import com.aracuai.mototaxi.model.Motorista;
import com.aracuai.mototaxi.model.Motorista.StatusMotorista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MotoristaRepository extends JpaRepository<Motorista, Long> {

    List<Motorista> findByStatus(StatusMotorista status);

    List<Motorista> findByStatusIn(List<StatusMotorista> status);
}
