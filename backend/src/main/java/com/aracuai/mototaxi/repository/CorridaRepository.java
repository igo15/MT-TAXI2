package com.aracuai.mototaxi.repository;

import com.aracuai.mototaxi.model.Corrida;
import com.aracuai.mototaxi.model.Corrida.StatusCorrida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CorridaRepository extends JpaRepository<Corrida, Long> {

    List<Corrida> findByClienteIdOrderByCriadaEmDesc(Long clienteId);

    List<Corrida> findByMotoristaIdOrderByCriadaEmDesc(Long motoristaId);

    List<Corrida> findByStatus(StatusCorrida status);
}
