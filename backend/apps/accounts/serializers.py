from rest_framework import serializers
from django.contrib.auth import authenticate
from apps.accounts.models import User

class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()
    company_id = serializers.SerializerMethodField()
    role_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email',
            'role', 'role_name', 'phone', 'job_title', 'is_active', 'is_staff', 'is_superuser',
            'company_id', 'company_name'
        )
        read_only_fields = ('id', 'is_active', 'company_id', 'company_name', 'role_name')

    def get_company_name(self, obj):
        return obj.company.raison_sociale if obj.company else None

    def get_company_id(self, obj):
        return obj.company.id if obj.company else None

    def get_role_name(self, obj):
        return obj.role.nom if obj.role else None

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'password',
            'role', 'phone', 'job_title', 'company'
        )

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        username_or_email = data['username']
        password = data['password']
        user = authenticate(username=username_or_email, password=password)
        if not user and '@' in username_or_email:
            try:
                user_obj = User.objects.get(email__iexact=username_or_email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        if not user:
            raise serializers.ValidationError("Identifiants invalides.")
        if not user.is_active:
            raise serializers.ValidationError("Compte désactivé.")
        data['user'] = user
        return data

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("L'ancien mot de passe est incorrect.")
        return value
