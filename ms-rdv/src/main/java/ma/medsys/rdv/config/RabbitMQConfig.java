package ma.medsys.rdv.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String QUEUE_APPOINTMENT_CREATED   = "appointment.created";
    public static final String QUEUE_APPOINTMENT_CANCELLED = "appointment.cancelled";
    public static final String QUEUE_APPOINTMENT_NOSHOW    = "appointment.noshow";
    public static final String QUEUE_APPOINTMENT_CONFIRMED = "appointment.confirmed";
    public static final String EXCHANGE_NAME               = "medsys.exchange";

    // ---- Queues ----

    @Bean
    public Queue appointmentCreatedQueue() {
        return QueueBuilder.durable(QUEUE_APPOINTMENT_CREATED).build();
    }

    @Bean
    public Queue appointmentCancelledQueue() {
        return QueueBuilder.durable(QUEUE_APPOINTMENT_CANCELLED).build();
    }

    @Bean
    public Queue appointmentNoShowQueue() {
        return QueueBuilder.durable(QUEUE_APPOINTMENT_NOSHOW).build();
    }

    @Bean
    public Queue appointmentConfirmedQueue() {
        return QueueBuilder.durable(QUEUE_APPOINTMENT_CONFIRMED).build();
    }

    // ---- Exchange ----

    @Bean
    public TopicExchange medsysExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    // ---- Bindings ----

    @Bean
    public Binding bindingCreated(Queue appointmentCreatedQueue, TopicExchange medsysExchange) {
        return BindingBuilder.bind(appointmentCreatedQueue).to(medsysExchange).with("appointment.created");
    }

    @Bean
    public Binding bindingCancelled(Queue appointmentCancelledQueue, TopicExchange medsysExchange) {
        return BindingBuilder.bind(appointmentCancelledQueue).to(medsysExchange).with("appointment.cancelled");
    }

    @Bean
    public Binding bindingNoShow(Queue appointmentNoShowQueue, TopicExchange medsysExchange) {
        return BindingBuilder.bind(appointmentNoShowQueue).to(medsysExchange).with("appointment.noshow");
    }

    @Bean
    public Binding bindingConfirmed(Queue appointmentConfirmedQueue, TopicExchange medsysExchange) {
        return BindingBuilder.bind(appointmentConfirmedQueue).to(medsysExchange).with("appointment.confirmed");
    }

    // Wildcard binding so any "appointment.*" routing key is captured
    @Bean
    public Binding bindingWildcard(TopicExchange medsysExchange) {
        return BindingBuilder
                .bind(QueueBuilder.durable("appointment.all").build())
                .to(medsysExchange)
                .with("appointment.#");
    }

    // ---- Message converter & template ----

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
