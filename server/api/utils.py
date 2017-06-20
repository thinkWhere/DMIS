from functools import wraps


class DMISAPIDecorators:
    """ Class for Tasking Manager custom API decorators """
    is_admin_only_resource = None
    authenticated_user_id = None  # Set by AuthenticationService when user has successfully authenticated

    def pm_only(self, admin_only_resource=True):
        """
        Indicates that users must have at least Project Manager role to access the resource
        :param admin_only_resource: Sets to True for Admin only resources
        """
        def admin_only_decorator(func):
            @wraps(func)
            def decorated_function(*args, **kwargs):
                self.is_admin_only_resource = admin_only_resource
                return func(*args, **kwargs)
            return decorated_function
        return admin_only_decorator
