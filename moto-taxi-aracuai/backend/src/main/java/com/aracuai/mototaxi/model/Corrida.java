package com.aracuai.mototaxi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "corridas")
public class Corrida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @ManyToOne
    @JoinColumn(name = "motorista_id")
    private Motorista motorista;

    // Origem
    private String origemEndereco;
    private Double origemLat;
    private Double origemLng;

    // Destino
    private String destinoEndereco;
    private Double destinoLat;
    private Double destinoLng;

    private Double distanciaKm;
    private Double valorEstimado;
    private Double valorFinal;

    @Enumerated(EnumType.STRING)
    private FormaPagamento formaPagamento;

    @Enumerated(EnumType.STRING)
    private StatusCorrida status = StatusCorrida.SOLICITADA;

    private LocalDateTime criadaEm = LocalDateTime.now();
    private LocalDateTime aceitaEm;
    private LocalDateTime iniciadaEm;
    private LocalDateTime finalizadaEm;
    private LocalDateTime canceladaEm;

    private String motivoCancelamento;

    public enum FormaPagamento {
        PIX, DINHEIRO
    }

    public enum StatusCorrida {
        SOLICITADA,        // Cliente pediu
        ACEITA,            // Motorista aceitou
        A_CAMINHO,         // Motorista indo buscar o cliente
        EM_VIAGEM,         // Passageiro a bordo
        FINALIZADA,        // Chegou no destino
        CANCELADA          // Cancelada por cliente ou motorista
    }

    // Construtores
    public Corrida() {}

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getCliente() { return cliente; }
    public void setCliente(Usuario cliente) { this.cliente = cliente; }

    public Motorista getMotorista() { return motorista; }
    public void setMotorista(Motorista motorista) { this.motorista = motorista; }

    public String getOrigemEndereco() { return origemEndereco; }
    public void setOrigemEndereco(String origemEndereco) { this.origemEndereco = origemEndereco; }

    public Double getOrigemLat() { return origemLat; }
    public void setOrigemLat(Double origemLat) { this.origemLat = origemLat; }

    public Double getOrigemLng() { return origemLng; }
    public void setOrigemLng(Double origemLng) { this.origemLng = origemLng; }

    public String getDestinoEndereco() { return destinoEndereco; }
    public void setDestinoEndereco(String destinoEndereco) { this.destinoEndereco = destinoEndereco; }

    public Double getDestinoLat() { return destinoLat; }
    public void setDestinoLat(Double destinoLat) { this.destinoLat = destinoLat; }

    public Double getDestinoLng() { return destinoLng; }
    public void setDestinoLng(Double destinoLng) { this.destinoLng = destinoLng; }

    public Double getDistanciaKm() { return distanciaKm; }
    public void setDistanciaKm(Double distanciaKm) { this.distanciaKm = distanciaKm; }

    public Double getValorEstimado() { return valorEstimado; }
    public void setValorEstimado(Double valorEstimado) { this.valorEstimado = valorEstimado; }

    public Double getValorFinal() { return valorFinal; }
    public void setValorFinal(Double valorFinal) { this.valorFinal = valorFinal; }

    public FormaPagamento getFormaPagamento() { return formaPagamento; }
    public void setFormaPagamento(FormaPagamento formaPagamento) { this.formaPagamento = formaPagamento; }

    public StatusCorrida getStatus() { return status; }
    public void setStatus(StatusCorrida status) { this.status = status; }

    public LocalDateTime getCriadaEm() { return criadaEm; }
    public void setCriadaEm(LocalDateTime criadaEm) { this.criadaEm = criadaEm; }

    public LocalDateTime getAceitaEm() { return aceitaEm; }
    public void setAceitaEm(LocalDateTime aceitaEm) { this.aceitaEm = aceitaEm; }

    public LocalDateTime getIniciadaEm() { return iniciadaEm; }
    public void setIniciadaEm(LocalDateTime iniciadaEm) { this.iniciadaEm = iniciadaEm; }

    public LocalDateTime getFinalizadaEm() { return finalizadaEm; }
    public void setFinalizadaEm(LocalDateTime finalizadaEm) { this.finalizadaEm = finalizadaEm; }

    public LocalDateTime getCanceladaEm() { return canceladaEm; }
    public void setCanceladaEm(LocalDateTime canceladaEm) { this.canceladaEm = canceladaEm; }

    public String getMotivoCancelamento() { return motivoCancelamento; }
    public void setMotivoCancelamento(String motivoCancelamento) { this.motivoCancelamento = motivoCancelamento; }
}
