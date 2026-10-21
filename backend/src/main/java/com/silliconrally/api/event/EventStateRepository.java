package com.silliconrally.api.event;

import org.springframework.data.jpa.repository.JpaRepository;
public interface EventStateRepository extends JpaRepository<EventState, Long> { }
