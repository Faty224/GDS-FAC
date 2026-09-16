from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            'status': response.status_code,
            'message': 'Une erreur est survenue lors du traitement de la requête.',
            'details': response.data
        }

        if isinstance(response.data, dict):
            if 'detail' in response.data:
                custom_data['message'] = str(response.data['detail'])
            elif 'non_field_errors' in response.data:
                custom_data['message'] = ' '.join([str(e) for e in response.data['non_field_errors']])

        response.data = custom_data
    else:
        # Unexpected server errors
        response = Response({
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'message': 'Une erreur interne du serveur s\'est produite.',
            'details': str(exc)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
