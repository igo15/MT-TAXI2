package com.aracuai.mototaxi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MotoTaxiApplication {

    public static void main(String[] args) {
        SpringApplication.run(MotoTaxiApplication.class, args);
        System.out.println("\n========================================");
        System.out.println("  🛵 Moto Táxi Araçuaí rodando!");
        System.out.println("  http://localhost:8080");
        System.out.println("  H2 Console: http://localhost:8080/h2-console");
        System.out.println("========================================\n");
    }
}
