package ma.medsys.notify.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ topology for MedSys appointment events.
 *
 * <p>All queues are durable so messages survive broker restarts.
 * The {@code medsys.exchange} TopicExchange routes events by routing key.</p>
 *
 * <p>Routing keys:</p>
 * <ul>
 *   <li>{@code appointment.created}   → patient/doctor confirmation notifications</li>
 *   <li>{@code appointment.cancelled} → patient cancellation notification</li>
 *   <li>{@code appointment.noshow}    → director no-show alert (threshold ≥ 3)</li>
 *   <li>{@code appointment.confirmed} → reserved for future use</li>
 * </ul>
 */
@Configuration
public class RabbitMQConfig {

    // ── Queue declarations ──────────────────────────────────────────────────

    @Bean
    public Queue appointmentCreatedQueue() {
        return new Queue("appointment.created", true);
    }

    @Bean
    public Queue appointmentCancelledQueue() {
        return new Queue("appointment.cancelled", true);
    }

    @Bean
    public Queue appointmentNoShowQueue() {
        return new Queue("appointment.noshow", true);
    }

    @Bean
    public Queue appointmentConfirmedQueue() {
        return new Queue("appointment.confirmed", true);
    }

    // ── Exchange ────────────────────────────────────────────────────────────

    @Bean
    public TopicExchange medsysExchange() {
        return new TopicExchange("medsys.exchange");
    }

    // ── Bindings ────────────────────────────────────────────────────────────

    @Bean
    public Binding bindingCreated(Queue appointmentCreatedQueue, TopicExchange medsysExchange) {
        return BindingBuilder
                .bind(appointmentCreatedQueue)
                .to(medsysExchange)
                .with("appointment.created");
    }

    @Bean
    public Binding bindingCancelled(Queue appointmentCancelledQueue, TopicExchange medsysExchange) {
        return BindingBuilder
                .bind(appointmentCancelledQueue)
                .to(medsysExchange)
                .with("appointment.cancelled");
    }

    @Bean
    public Binding bindingNoShow(Queue appointmentNoShowQueue, TopicExchange medsysExchange) {
        return BindingBuilder
                .bind(appointmentNoShowQueue)
                .to(medsysExchange)
                .with("appointment.noshow");
    }

    @Bean
    public Binding bindingConfirmed(Queue appointmentConfirmedQueue, TopicExchange medsysExchange) {
        return BindingBuilder
                .bind(appointmentConfirmedQueue)
                .to(medsysExchange)
                .with("appointment.confirmed");
    }

    // ── Message converter & template ────────────────────────────────────────

    /**
     * Use Jackson to serialize/deserialize AMQP messages as JSON.
     */
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
