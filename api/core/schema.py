import graphene
from django.db.models import Q
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField

from api.permissions import IsOwner, login_required
from .models import Palette, PaletteCollection, PaletteSwatch, Room, Bookshelf, Notebook, Page, Element


class RoomNode(IsOwner, DjangoObjectType):
    class Meta:
        model = Room
        filter_fields = ['uid']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class BookshelfNode(IsOwner, DjangoObjectType):
    class Meta:
        model = Bookshelf
        filter_fields = ['uid', 'room']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class NotebookNode(IsOwner, DjangoObjectType):
    class Meta:
        model = Notebook
        filter_fields = ['uid', 'bookshelf']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class PageNode(IsOwner, DjangoObjectType):
    class Meta:
        model = Page
        filter_fields = ['uid', 'notebook']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class ElementNode(IsOwner, DjangoObjectType):
    class Meta:
        model = Element
        filter_fields = {
            'uid': ['exact'],
            'page__uid': ['exact'],
        }
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class PaletteCollectionNode(IsOwner, DjangoObjectType):
    class Meta:
        model = PaletteCollection
        filter_fields = ['uid']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False


class PaletteNode(DjangoObjectType):
    class Meta:
        model = Palette
        filter_fields = ['uid']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False

    @classmethod
    def get_queryset(cls, queryset, info):
        return queryset.filter(Q(owner=info.context.user) | Q(is_public=True))


class PaletteSwatchNode(DjangoObjectType):
    class Meta:
        model = PaletteSwatch
        filter_fields = ['uid']
        interfaces = (graphene.relay.Node, )
        convert_choices_to_enum = False

    @classmethod
    def get_queryset(cls, queryset, info):
        return queryset.filter(Q(owner=info.context.user) | Q(palette__is_public=True))

class CreateRoom(graphene.relay.ClientIDMutation):
    room = graphene.Field(RoomNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        room = Room.objects.create(
            owner=info.context.user
        )
        return CreateRoom(room=room)


class CreateBookshelf(graphene.relay.ClientIDMutation):
    class Input:
        room_uid = graphene.UUID(required=True)

    bookshelf = graphene.Field(BookshelfNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        room = Room.objects.get(uid=input['room_uid'])
        bookshelf = Bookshelf.objects.create(
            owner=info.context.user,
            room=room
        )

        return CreateBookshelf(bookshelf=bookshelf)


class UpdateBookshelf(graphene.relay.ClientIDMutation):
    class Input:
        uid = graphene.UUID(required=True)
        notebook_order = graphene.List(graphene.UUID, required=False)

    bookshelf = graphene.Field(BookshelfNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        bookshelf = Bookshelf.objects.get(uid=input['uid'])

        for k, v in input.items():
            if k == 'uid':
                continue

            setattr(bookshelf, k, v)

        bookshelf.save()

        return UpdateBookshelf(bookshelf=bookshelf)


class CreateNotebook(graphene.relay.ClientIDMutation):
    class Input:
        bookshelf_uid = graphene.UUID(required=True)
        title = graphene.String(required=False)

    notebook = graphene.Field(NotebookNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        bookshelf = Bookshelf.objects.get(uid=input['bookshelf_uid'])
        notebook = Notebook.objects.create(
            owner=info.context.user,
            bookshelf=bookshelf,
            title=input.get('title', None)
        )

        return CreateNotebook(notebook=notebook)


class UpdateNotebook(graphene.relay.ClientIDMutation):
    class Input:
        uid = graphene.UUID(required=True)
        title = graphene.String(required=False)
        bookshelf_uid = graphene.UUID(required=False)
        page_order = graphene.List(graphene.UUID, required=False)

    notebook = graphene.Field(NotebookNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        notebook = Notebook.objects.get(uid=input['uid'])

        for k, v in input.items():
            if k == 'uid':
                continue

            if k == 'bookshelf_uid':
                current_shelf = notebook.bookshelf
                current_shelf.notebook_order.remove(notebook.uid)
                current_shelf.save()

                new_bookshelf = Bookshelf.objects.get(uid=v)
                new_bookshelf.notebook_order.append(notebook.uid)
                new_bookshelf.save()
                notebook.bookshelf = new_bookshelf
                continue

            setattr(notebook, k, v)

        notebook.save()

        return UpdateNotebook(notebook=notebook)


class DeleteNotebook(graphene.relay.ClientIDMutation):
    class Input:
        uid = graphene.UUID(required=True)

    notebook = graphene.Field(NotebookNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        notebook = Notebook.objects.get(uid=input['uid'])
        notebook.delete()

        return DeleteNotebook(notebook=notebook)


class CreatePage(graphene.relay.ClientIDMutation):
    class Input:
        notebook_uid = graphene.UUID(required=True)
        paper_swatch_uid = graphene.UUID(required=False)
        pattern_swatch_uid = graphene.UUID(required=False)
        pattern_type = graphene.Int(required=False)
        pattern_size = graphene.Float(required=False)
        pattern_spacing = graphene.Float(required=False)
        pattern_opacity = graphene.Int(required=False)
        canvas_data_url = graphene.String(required=False)

    page = graphene.Field(PageNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        notebook = Notebook.objects.get(uid=input['notebook_uid'])
        page = Page.objects.create(
            owner=info.context.user,
            notebook=notebook,
        )

        for k, v in input.items():
            if k == 'notebook_uid':
                continue

            if k == 'paper_swatch_uid':
                page.paper_swatch = PaletteSwatch.objects.get(uid=v)
                continue

            if k == 'pattern_swatch_uid':
                page.pattern_swatch = PaletteSwatch.objects.get(uid=v)
                continue

            setattr(page, k, v)

        page.save()

        return CreatePage(page=page)


class UpdatePage(graphene.relay.ClientIDMutation):
    class Input:
        uid = graphene.UUID(required=True)
        notebook_uid = graphene.UUID(required=False)
        paper_swatch_uid = graphene.UUID(required=False)
        pattern_swatch_uid = graphene.UUID(required=False)
        pattern_type = graphene.Int(required=False)
        pattern_size = graphene.Float(required=False)
        pattern_spacing = graphene.Float(required=False)
        pattern_opacity = graphene.Int(required=False)
        canvas_data_url = graphene.String(required=False)

    page = graphene.Field(PageNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        page = Page.objects.get(uid=input['uid'])

        for k, v in input.items():
            if k == 'uid':
                continue

            if k == 'notebook_uid':
                current_notebook = page.notebook
                current_notebook.page_order.remove(page.uid)
                current_notebook.save()

                new_notebook = Notebook.objects.get(uid=v)
                new_notebook.page_order.append(page.uid)
                new_notebook.save()

                page.notebook = new_notebook
                continue

            if k == 'paper_swatch_uid':
                page.paper_swatch = PaletteSwatch.objects.get(uid=v)
                continue

            if k == 'pattern_swatch_uid':
                page.pattern_swatch = PaletteSwatch.objects.get(uid=v)
                continue

            setattr(page, k, v)

        page.save()

        return UpdatePage(page=page)


class DeletePage(graphene.relay.ClientIDMutation):
    class Input:
        uid = graphene.UUID(required=True)

    page = graphene.Field(PageNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        page = Page.objects.get(uid=input['uid'])
        page.delete()

        return DeletePage(page=page)


class BatchSaveElements(graphene.relay.ClientIDMutation):
    class Input:
        elements = graphene.List(graphene.JSONString, required=True)

    elements = graphene.List(ElementNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        elements = []
        for input_element in input['elements']:
            element_uid = input_element.get('uid', None)
            if element_uid is not None:
                element = Element.objects.get(uid=element_uid)
            else:
                page = Page.objects.get(uid=input_element['page_uid'])
                element = Element.objects.create(
                    owner=info.context.user,
                    page=page,
                    tool=input_element['tool'],
                    points=input_element['points'],
                )

            for k, v in input_element.items():
                if k == 'uid':
                    continue

                if k == 'page_uid':
                    continue

                setattr(element, k, v)

            element.save()
            elements.append(element)

        return BatchSaveElements(elements=elements)

class CreateElement(graphene.relay.ClientIDMutation):
    class Input:
        page_uid = graphene.UUID(required=True)
        tool = graphene.Int(required=True)
        points = graphene.JSONString(required=True)
        settings = graphene.JSONString(required=False)
        transform = graphene.JSONString(required=False)
        dimensions = graphene.JSONString(required=False)
        canvas_settings = graphene.JSONString(required=False)
        canvas_data_url = graphene.String(required=False)
        is_cached = graphene.Boolean(required=False)
        is_html_element = graphene.Boolean(required=False)
        is_hidden = graphene.Boolean(required=False)

    element = graphene.Field(ElementNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        page = Page.objects.get(uid=input['page_uid'])
        element = Element.objects.create(
            owner=info.context.user,
            page=page,
            tool=input['tool'],
            points=input['points']
        )

        for k, v in input.items():
            if k == 'page_uid':
                continue

            if k == 'tool':
                continue

            if k == 'points':
                continue

            setattr(element, k, v)

        element.save()

        return CreateElement(element=element)


class UpdateElement(graphene.relay.ClientIDMutation):
    class Input:
        uid = graphene.UUID(required=True)
        page_uid = graphene.UUID(required=False)
        tool = graphene.Int(required=False)
        points = graphene.JSONString(required=False)
        settings = graphene.JSONString(required=False)
        transform = graphene.JSONString(required=False)
        dimensions = graphene.JSONString(required=False)
        canvas_settings = graphene.JSONString(required=False)
        canvas_data_url = graphene.String(required=False)
        is_cached = graphene.Boolean(required=False)
        is_html_element = graphene.Boolean(required=False)
        is_hidden = graphene.Boolean(required=False)


    element = graphene.Field(ElementNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        element = Element.objects.get(uid=input['uid'])

        for k, v in input.items():
            if k == 'uid':
                continue

            if k == 'page_uid':
                current_page = element.page
                current_page.element_order.remove(element.uid)
                current_page.save()

                new_page = Page.objects.get(uid=v)
                new_page.element_order.append(element.uid)
                new_page.save()

                element.page = new_page
                continue

            setattr(element, k, v)

        element.save()

        return UpdateElement(element=element)


class DeleteElement(graphene.relay.ClientIDMutation):
    class Input:
        uid = graphene.UUID(required=True)

    element = graphene.Field(ElementNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        element = Element.objects.get(uid=input['uid'])
        element['is_hidden'] = True
        element.save()

        return DeleteElement(element=element)


class CreatePalette(graphene.relay.ClientIDMutation):
    class Input:
        title = graphene.String(required=False)
        swatches = graphene.List(graphene.JSONString, required=False)

    palette = graphene.Field(PaletteNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        collection = PaletteCollection.objects.get(owner=info.context.user)
        palette = Palette.objects.create(
            owner=info.context.user
        )
        palette.collections.add(collection)

        for k, v in input.items():
            if k == 'swatches':
                for swatch_json in v:
                    swatch = PaletteSwatch.objects.create(
                        owner=info.context.user,
                        palette=palette,
                        swatch=swatch_json,
                    )
                    swatch.save()
                continue

            setattr(palette, k, v)

        palette.save()

        return CreatePalette(palette=palette)


class UpdatePalette(graphene.relay.ClientIDMutation):
    class Input:
        uid = graphene.UUID(required=True)
        title = graphene.String(required=False)

    palette = graphene.Field(PaletteNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        palette = Palette.objects.get(uid=input['uid'])

        if palette.owner != info.context.user:
            raise Exception('You do not have permission to update this palette.')

        for k, v in input.items():
            if k == 'uid':
                continue
            setattr(palette, k, v)

        palette.save()

        return UpdatePalette(palette=palette)


class DeletePalette(graphene.relay.ClientIDMutation):
    class Input:
        uid = graphene.UUID(required=True)

    palette = graphene.Field(PaletteNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        palette = Palette.objects.get(uid=input['uid'])

        if palette.owner != info.context.user:
            raise Exception('You do not have permission to update this palette.')

        palette.delete()

        return DeletePalette(palette=palette)


class CreatePaletteSwatch(graphene.relay.ClientIDMutation):
    class Input:
        palette_uid = graphene.UUID(required=True)
        swatch = graphene.JSONString(required=True)

    swatch = graphene.Field(PaletteSwatchNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        palette = Palette.objects.get(uid=input['palette_uid'])
        swatch = PaletteSwatch.objects.create(
            owner=info.context.user,
            palette=palette,
            swatch=input['swatch'],
        )

        return CreatePaletteSwatch(swatch=swatch)


class UpdatePaletteSwatch(graphene.relay.ClientIDMutation):
    class Input:
        uid = graphene.UUID(required=True)
        swatch = graphene.JSONString(required=False)

    swatch = graphene.Field(PaletteSwatchNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        swatch = PaletteSwatch.objects.get(uid=input['uid'])

        if swatch.owner != info.context.user:
            raise Exception('You do not have permission to update this palette.')

        for k, v in input.items():
            if k == 'uid':
                continue
            setattr(swatch, k, v)

        swatch.save()

        return UpdatePaletteSwatch(swatch=swatch)


class DeletePaletteSwatch(graphene.relay.ClientIDMutation):
    class Input:
        uid = graphene.UUID(required=True)

    swatch = graphene.Field(PaletteSwatchNode)

    @classmethod
    @login_required
    def mutate_and_get_payload(cls, root, info, **input):
        swatch = PaletteSwatch.objects.get(uid=input['uid'])

        if swatch.owner != info.context.user:
            raise Exception('You do not have permission to update this palette.')

        swatch.delete()

        return DeletePaletteSwatch(swatch=swatch)


class CoreQuery(graphene.ObjectType):
    room = graphene.relay.Node.Field(RoomNode)
    my_rooms = DjangoFilterConnectionField(RoomNode)

    bookshelf = graphene.relay.Node.Field(BookshelfNode)
    my_bookshelves = DjangoFilterConnectionField(BookshelfNode)

    notebook = graphene.relay.Node.Field(NotebookNode)
    my_notebooks = DjangoFilterConnectionField(NotebookNode)

    page = graphene.relay.Node.Field(PageNode)
    my_pages = DjangoFilterConnectionField(PageNode)

    element = graphene.relay.Node.Field(ElementNode)
    my_elements = DjangoFilterConnectionField(ElementNode)

    palette_collection = graphene.relay.Node.Field(PaletteCollectionNode)
    my_palette_collection = DjangoFilterConnectionField(PaletteCollectionNode)

    palette = graphene.relay.Node.Field(PaletteNode)
    my_palettes = DjangoFilterConnectionField(PaletteNode)

    palette_swatch = graphene.relay.Node.Field(PaletteSwatchNode)
    my_palette_swatchs = DjangoFilterConnectionField(PaletteSwatchNode)


class CoreMutation(graphene.ObjectType):
    # create_room = CreateRoom.Field()

    create_bookshelf = CreateBookshelf.Field()
    update_bookshelf = UpdateBookshelf.Field()

    create_notebook = CreateNotebook.Field()
    update_notebook = UpdateNotebook.Field()
    delete_notebook = DeleteNotebook.Field()

    create_page = CreatePage.Field()
    update_page = UpdatePage.Field()
    delete_page = DeletePage.Field()

    create_element = CreateElement.Field()
    update_element = UpdateElement.Field()
    delete_element = DeleteElement.Field()
    batch_save_elements = BatchSaveElements.Field()

    create_palette = CreatePalette.Field()
    update_palette = UpdatePalette.Field()
    delete_palette = DeletePalette.Field()

    create_palette_swatch = CreatePaletteSwatch.Field()
    update_palette_swatch = UpdatePaletteSwatch.Field()
    delete_palette_swatch = DeletePaletteSwatch.Field()
