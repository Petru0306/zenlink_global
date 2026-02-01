package com.zenlink.zenlink.controller;

import com.zenlink.zenlink.dto.PsychProfileResponse;
import com.zenlink.zenlink.model.User;
import com.zenlink.zenlink.service.PsychProfileService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PsychProfileControllerTest {
    @Mock
    private PsychProfileService psychProfileService;

    @InjectMocks
    private PsychProfileController controller;

    @Test
    void getProfileUsesAuthenticatedUserOnly() {
        User user = new User();
        user.setId(7L);

        PsychProfileResponse response = new PsychProfileResponse();
        response.setCompleted(false);

        when(psychProfileService.getProfile(user)).thenReturn(response);

        ResponseEntity<?> entity = controller.getProfile(user);

        assertEquals(200, entity.getStatusCode().value());
        verify(psychProfileService, times(1)).getProfile(user);
        verifyNoMoreInteractions(psychProfileService);
    }
}

