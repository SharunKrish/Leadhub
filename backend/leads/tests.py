from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Lead, LeadNote

class LeadAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpassword",
            email="testuser@example.com"
        )
        self.token = Token.objects.create(user=self.user).key
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token)

        self.lead1 = Lead.objects.create(
            user=self.user,
            name="John Doe",
            email="john@example.com",
            phone_number="+1234567890",
            lead_source="facebook",
            lead_status="new"
        )
        self.lead2 = Lead.objects.create(
            user=self.user,
            name="Jane Smith",
            email="jane@example.com",
            phone_number="+1987654321",
            lead_source="google",
            lead_status="contacted"
        )

    def test_list_leads(self):
        url = reverse('lead-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Results are paginated, so they will be inside a 'results' key
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 2)

    def test_search_leads(self):
        url = reverse('lead-list')
        response = self.client.get(url, {'q': 'Jane'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], "Jane Smith")

    def test_filter_leads(self):
        url = reverse('lead-list')
        response = self.client.get(url, {'source': 'facebook'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], "John Doe")

    def test_create_lead(self):
        url = reverse('lead-list')
        data = {
            "name": "Bob Miller",
            "email": "bob@example.com",
            "phone_number": "+1444555666",
            "lead_source": "organic",
            "lead_status": "new"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lead.objects.count(), 3)
        self.assertEqual(Lead.objects.get(email="bob@example.com").name, "Bob Miller")

    def test_create_lead_invalid_phone(self):
        url = reverse('lead-list')
        data = {
            "name": "Bob Miller",
            "email": "bob@example.com",
            "phone_number": "invalid-phone",
            "lead_source": "organic",
            "lead_status": "new"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone_number', response.data)

    def test_create_lead_duplicate_email(self):
        url = reverse('lead-list')
        data = {
            "name": "John Duplicate",
            "email": "john@example.com",
            "phone_number": "+1234567890",
            "lead_source": "facebook",
            "lead_status": "new"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_update_lead(self):
        url = reverse('lead-detail', kwargs={'pk': self.lead1.pk})
        data = {
            "name": "John Updated",
            "email": "john@example.com",
            "phone_number": "+1234567890",
            "lead_source": "facebook",
            "lead_status": "qualified"
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.lead1.refresh_from_db()
        self.assertEqual(self.lead1.name, "John Updated")
        self.assertEqual(self.lead1.lead_status, "qualified")

    def test_delete_lead(self):
        url = reverse('lead-detail', kwargs={'pk': self.lead1.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Lead.objects.count(), 1)

    def test_dashboard_stats(self):
        url = reverse('dashboard-stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_leads'], 2)
        self.assertEqual(response.data['source_distribution']['facebook'], 1)
        self.assertEqual(response.data['status_summary']['new'], 1)

class AuthAPITests(APITestCase):
    def setUp(self):
        from django.contrib.auth.models import User
        self.user = User.objects.create_user(
            username="testuser",
            password="testpassword",
            email="testuser@example.com"
        )

    def test_login_success(self):
        url = reverse('login')
        data = {
            "username": "testuser",
            "password": "testpassword"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_invalid_credentials(self):
        url = reverse('login')
        data = {
            "username": "testuser",
            "password": "wrongpassword"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_profile_and_logout(self):
        # 1. Login to get token
        login_url = reverse('login')
        login_data = {
            "username": "testuser",
            "password": "testpassword"
        }
        login_response = self.client.post(login_url, login_data, format='json')
        token = login_response.data['token']

        # 2. Access profile with token
        profile_url = reverse('user-profile')
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)
        profile_response = self.client.get(profile_url)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['username'], "testuser")

        # 3. Logout
        logout_url = reverse('logout')
        logout_response = self.client.post(logout_url)
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

        # 4. Verify profile access is now unauthorized
        profile_response_after_logout = self.client.get(profile_url)
        self.assertEqual(profile_response_after_logout.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_register_success(self):
        url = reverse('register')
        data = {
            "username": "newregistereduser",
            "password": "newpassword",
            "email": "new@example.com"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['username'], "newregistereduser")

    def test_register_duplicate_username(self):
        url = reverse('register')
        data = {
            "username": "testuser",
            "password": "somepassword",
            "email": "other@example.com"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PingAPITests(APITestCase):
    def test_ping_endpoint(self):
        url = reverse('ping')
        # The ping endpoint should be accessible without credentials
        self.client.credentials()
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"status": "healthy"})


