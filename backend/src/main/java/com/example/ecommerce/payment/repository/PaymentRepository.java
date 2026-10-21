package com.example.ecommerce.payment.repository;

import com.example.ecommerce.payment.model.Payment;
import com.example.ecommerce.payment.model.PaymentStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByStripeSessionId(String stripeSessionId);

    Optional<Payment> findFirstByOrderIdAndStatusOrderByIdDesc(Long orderId, PaymentStatus status);

    List<Payment> findByOrderIdAndStatus(Long orderId, PaymentStatus status);

    boolean existsByOrderIdAndStatus(Long orderId, PaymentStatus status);

    long countByOrderId(Long orderId);

    List<Payment> findByOrderIdOrderByIdDesc(Long orderId);
}
