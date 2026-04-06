package ma.medsys.notify;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * MedSys Notification Service.
 *
 * <p>Provides real-time push notifications via WebSocket/STOMP, HTML email delivery
 * via Thymeleaf templates, and asynchronous event consumption from RabbitMQ.</p>
 *
 * <p>Runs on port 8084. WebSocket endpoint: ws://localhost:8084/ws</p>
 */
@SpringBootApplication
@EnableScheduling
public class MsNotifyApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsNotifyApplication.class, args);
    }
}
