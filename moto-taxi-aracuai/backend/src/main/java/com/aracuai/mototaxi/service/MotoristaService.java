package com.aracuai.mototaxi.service;

import com.aracuai.mototaxi.model.Motorista;
import com.aracuai.mototaxi.repository.MotoristaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MotoristaService {

    private final MotoristaRepository motoristaRepository;

    public MotoristaService(MotoristaRepository motoristaRepository) {
        this.motoristaRepository = motoristaRepository;
    }

    public List<Motorista> listarLivres() {
        return motoristaRepository.findByStatus(Motorista.StatusMotorista.LIVRE);
    }

    public List<Motorista> listarTodos() {
        return motoristaRepository.findAll();
    }

    @Transactional
    public Motorista atualizarLocalizacao(Long id, Double lat, Double lng) {
        Motorista m = motoristaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Motorista não encontrado"));
        m.setLatitude(lat);
        m.setLongitude(lng);
        return motoristaRepository.save(m);
    }

    @Transactional
    public Motorista atualizarStatus(Long id, Motorista.StatusMotorista status) {
        Motorista m = motoristaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Motorista não encontrado"));
        m.setStatus(status);
        return motoristaRepository.save(m);
    }
}
