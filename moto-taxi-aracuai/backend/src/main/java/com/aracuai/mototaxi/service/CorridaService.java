package com.aracuai.mototaxi.service;

import com.aracuai.mototaxi.dto.CorridaRequest;
import com.aracuai.mototaxi.model.*;
import com.aracuai.mototaxi.repository.CorridaRepository;
import com.aracuai.mototaxi.repository.MotoristaRepository;
import com.aracuai.mototaxi.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CorridaService {

    private final CorridaRepository corridaRepository;
    private final UsuarioRepository usuarioRepository;
    private final MotoristaRepository motoristaRepository;

    @Value("${app.preco-por-km:4.00}")
    private double precoPorKm;

    public CorridaService(CorridaRepository corridaRepository,
                          UsuarioRepository usuarioRepository,
                          MotoristaRepository motoristaRepository) {
        this.corridaRepository = corridaRepository;
        this.usuarioRepository = usuarioRepository;
        this.motoristaRepository = motoristaRepository;
    }

    @Transactional
    public Corrida solicitar(CorridaRequest req) {
        Usuario cliente = usuarioRepository.findById(req.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        double distancia = calcularDistancia(
                req.getOrigemLat(), req.getOrigemLng(),
                req.getDestinoLat(), req.getDestinoLng()
        );

        // Fator de ruas reais (~15% a mais)
        distancia = distancia * 1.15;

        Corrida corrida = new Corrida();
        corrida.setCliente(cliente);
        corrida.setOrigemEndereco(req.getOrigemEndereco());
        corrida.setOrigemLat(req.getOrigemLat());
        corrida.setOrigemLng(req.getOrigemLng());
        corrida.setDestinoEndereco(req.getDestinoEndereco());
        corrida.setDestinoLat(req.getDestinoLat());
        corrida.setDestinoLng(req.getDestinoLng());
        corrida.setDistanciaKm(Math.round(distancia * 10.0) / 10.0);
        corrida.setValorEstimado(Math.round(distancia * precoPorKm * 100.0) / 100.0);
        corrida.setFormaPagamento(Corrida.FormaPagamento.valueOf(req.getFormaPagamento().toUpperCase()));
        corrida.setStatus(Corrida.StatusCorrida.SOLICITADA);

        return corridaRepository.save(corrida);
    }

    @Transactional
    public Corrida aceitar(Long corridaId, Long motoristaId) {
        Corrida corrida = corridaRepository.findById(corridaId)
                .orElseThrow(() -> new RuntimeException("Corrida não encontrada"));

        if (corrida.getStatus() != Corrida.StatusCorrida.SOLICITADA) {
            throw new RuntimeException("Corrida já foi aceita ou cancelada");
        }

        Motorista motorista = motoristaRepository.findById(motoristaId)
                .orElseThrow(() -> new RuntimeException("Motorista não encontrado"));

        if (motorista.getStatus() == Motorista.StatusMotorista.EM_CORRIDA) {
            throw new RuntimeException("Motorista já está em outra corrida");
        }

        corrida.setMotorista(motorista);
        corrida.setStatus(Corrida.StatusCorrida.ACEITA);
        corrida.setAceitaEm(LocalDateTime.now());

        motorista.setStatus(Motorista.StatusMotorista.EM_CORRIDA);
        motoristaRepository.save(motorista);

        return corridaRepository.save(corrida);
    }

    @Transactional
    public Corrida atualizarStatus(Long corridaId, Corrida.StatusCorrida novoStatus) {
        Corrida corrida = corridaRepository.findById(corridaId)
                .orElseThrow(() -> new RuntimeException("Corrida não encontrada"));

        corrida.setStatus(novoStatus);

        switch (novoStatus) {
            case A_CAMINHO -> { /* já aceita */ }
            case EM_VIAGEM -> corrida.setIniciadaEm(LocalDateTime.now());
            case FINALIZADA -> {
                corrida.setFinalizadaEm(LocalDateTime.now());
                corrida.setValorFinal(corrida.getValorEstimado()); // pode ajustar depois
                if (corrida.getMotorista() != null) {
                    Motorista m = corrida.getMotorista();
                    m.setStatus(Motorista.StatusMotorista.LIVRE);
                    m.setTotalCorridas(m.getTotalCorridas() + 1);
                    motoristaRepository.save(m);
                }
            }
            case CANCELADA -> {
                corrida.setCanceladaEm(LocalDateTime.now());
                if (corrida.getMotorista() != null) {
                    Motorista m = corrida.getMotorista();
                    m.setStatus(Motorista.StatusMotorista.LIVRE);
                    motoristaRepository.save(m);
                }
            }
            default -> {}
        }

        return corridaRepository.save(corrida);
    }

    @Transactional
    public Corrida cancelar(Long corridaId, String motivo) {
        Corrida corrida = atualizarStatus(corridaId, Corrida.StatusCorrida.CANCELADA);
        corrida.setMotivoCancelamento(motivo);
        return corridaRepository.save(corrida);
    }

    public Optional<Corrida> buscarPorId(Long id) {
        return corridaRepository.findById(id);
    }

    public List<Corrida> listarPorCliente(Long clienteId) {
        return corridaRepository.findByClienteIdOrderByCriadaEmDesc(clienteId);
    }

    public List<Corrida> listarSolicitadas() {
        return corridaRepository.findByStatus(Corrida.StatusCorrida.SOLICITADA);
    }

    /** Fórmula de Haversine (distância em km) */
    private double calcularDistancia(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
