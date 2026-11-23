package com.example.ecommerce.product.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.ecommerce.common.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;

class ProductServiceTest {

    @Test
    void sizeIsCappedAt100AndNegativePageIsClamped() {
        Pageable p = ProductService.pageable(-3, 5000, "price,asc");
        assertThat(p.getPageSize()).isEqualTo(100);
        assertThat(p.getPageNumber()).isZero();
        assertThat(p.getSort().getOrderFor("price").getDirection()).isEqualTo(Direction.ASC);
    }

    @Test
    void defaultSortIsNewestFirst() {
        Pageable p = ProductService.pageable(0, 12, null);
        assertThat(p.getSort().getOrderFor("createdAt").getDirection()).isEqualTo(Direction.DESC);
        assertThat(p.getSort().getOrderFor("id")).isNotNull();
    }

    @Test
    void sortFieldOutsideWhitelistIsRejected() {
        assertThatThrownBy(() -> ProductService.pageable(0, 12, "password,asc"))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> ProductService.pageable(0, 12, "price,sideways"))
                .isInstanceOf(BadRequestException.class);
    }
}
