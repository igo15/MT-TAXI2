package com.aracuai.mototaxi.model;

import jakarta.persistence.*;

@Entity
@Table(name = "motoristas")
public class Motorista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    private String placa;
    private String modeloMoto;
    private Double nota = 5.0;
    private Integer totalCorridas = 0;

    // Localização atual
    private Double latitude;
    private Double longitude;

    @Enumerated(EnumType.STRING)
    private StatusMotorista status = StatusMotorista.OFFLINE;

    public enum StatusMotorista {
        OFFLINE, LIVRE, EM_CORRIDA
    }

    // Construtores
    public Motorista() {}

    public Motorista(Usuario usuario, String placa, String modeloMoto) {
        this.usuario = usuario;
        this.placa = placa;
        this.modeloMoto = modeloMoto;
        this.status = StatusMotorista.LIVRE;
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public String getPlaca() { return placa; }
    public void setPlaca(String placa) { this.placa = placa; }

    public String getModeloMoto() { return modeloMoto; }
    public void setModeloMoto(String modeloMoto) { this.modeloMoto = modeloMoto; }

    public Double getNota() { return nota; }
    public void setNota(Double nota) { this.nota = nota; }

    public Integer getTotalCorridas() { return totalCorridas; }
    public void setTotalCorridas(Integer totalCorridas) { this.totalCorridas = totalCorridas; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public StatusMotorista getStatus() { return status; }
    public void setStatus(StatusMotorista status) { this.status = status; }
}
