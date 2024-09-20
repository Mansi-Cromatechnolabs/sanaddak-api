import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';
import { NO_AUTH_REQUIRED } from 'src/config/constant.config';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const noAuthRequire = this.reflector.getAllAndOverride<boolean>(
      NO_AUTH_REQUIRED,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || noAuthRequire) {
      return true;
    }
    const request = context.switchToHttp().getRequest();

    // get rid of /api
    let currentRequest = request?.url.match(/api(.*)/)[1];

    // get rid of query params
    currentRequest = this.transformUrl(currentRequest);

    //get rid of digit
    currentRequest = this.transformPathWithId(currentRequest);
    // const permissions = await this.authService.getUserPermissions(request.user);

    // const isAllowed = this.isPermitted(permissions.groupedPermissions, currentRequest);
    // if (!isAllowed) {
    //     throw new NotFoundException({ message: 'Requested Page not found!', statusCode: 404 });
    // }
    return true;
  }

  private transformUrl(url: string): string {
    const queryParamsIndex = url.indexOf('/list');
    let path = queryParamsIndex !== -1 ? url.slice(0, queryParamsIndex) : url;

    const createIndex = path.indexOf('/create');
    path =
      createIndex !== -1
        ? path.slice(0, createIndex + '/create'.length) + '/:id'
        : path;

    const updateIndex = path.indexOf('/update');
    path =
      updateIndex !== -1
        ? path.slice(0, updateIndex + '/update'.length) + '/:id'
        : path;

    const deleteIndex = path.indexOf('/delete');
    path =
      deleteIndex !== -1
        ? path.slice(0, deleteIndex + '/delete'.length) + '/:id'
        : path;

    if (
      queryParamsIndex &&
      createIndex == -1 &&
      updateIndex == -1 &&
      deleteIndex == -1
    ) {
      const segments = url.split('/');
      path = segments.length > 1 ? '/' + segments[1] : url;
    }

    return path;
  }

  private transformPathWithId(url: string): string {
    // Split the URL path by '/'
    const segments = url.split('/');
    // Get the last segment

    const lastSegment = segments[segments.length - 1];
    // Check if the last segment is a digit
    if (/^\d+$/.test(lastSegment)) {
      // Replace the last segment with ':id'
      segments[segments.length - 1] = ':id';
      // Join the segments back together
      return segments.join('/');
    }
    // Return the original URL if the last segment is not a digit
    return url;
  }

  private isPermitted(permissions, currentRequest: string): boolean {
    for (const parentMenu in permissions) {
      const menus = permissions[parentMenu];
      for (const menu in menus) {
        const actions = menus[menu];
        for (const action in actions) {
          const url = actions[action];
          if (currentRequest === url) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
